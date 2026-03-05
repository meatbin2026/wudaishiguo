#!/usr/bin/env python3
import hashlib
import json
import os
import re
import secrets
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "app.db"
STATIC_DIR = BASE_DIR / "static"
QUALITY_RULES_PATH = BASE_DIR / "quality_rules.json"
HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8000"))
APP_VERSION = "0.9.0-beta"
SESSION_HOURS = 24 * 7
AUTO_SETTLE_HOURS = 72
AUTO_SETTLE_INTERVAL_SECONDS = 60
DEFAULT_REGISTER_POINTS = 200
REPUTATION_MIN = 0
REPUTATION_MAX = 100
MAX_BODY_BYTES = 100 * 1024
MAX_TITLE_LEN = 120
MAX_DESC_LEN = 2000
MAX_CRITERIA_LEN = 800
MAX_ANSWER_LEN = 3000
MAX_LINKS_PER_ANSWER = 8
MAX_REASON_LEN = 300
MAX_EVIDENCE_LEN = 2000
MAX_USERNAME_LEN = 32

DB_LOCK = threading.Lock()
QUALITY_RULES = {}
QUALITY_RULES_VERSION = ""
RATE_LIMIT_BUCKET = {}
RATE_LIMIT_LOCK = threading.Lock()


DEFAULT_QUALITY_RULES = {
    "base_score": 35.0,
    "length_max_chars": 400,
    "length_max_bonus": 30.0,
    "valid_link_bonus_per": 8.0,
    "valid_link_bonus_cap": 24.0,
    "invalid_link_penalty_per": 6.0,
    "duplicate_link_penalty": 4.0,
    "short_content_threshold": 20,
    "short_content_penalty": 15.0,
    "similarity_penalty_rules": [
        {"threshold": 0.9, "penalty": 30.0},
        {"threshold": 0.75, "penalty": 18.0},
        {"threshold": 0.6, "penalty": 8.0},
    ],
}


def utc_now():
    return datetime.now(timezone.utc)


def utc_iso(ts=None):
    current = ts or utc_now()
    return current.isoformat().replace("+00:00", "Z")


def parse_iso(value):
    if not value:
        return None
    normalized = value.replace("Z", "+00:00")
    return datetime.fromisoformat(normalized).astimezone(timezone.utc)


def parse_int(value, default_value, min_value=None, max_value=None):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = default_value
    if min_value is not None:
        parsed = max(min_value, parsed)
    if max_value is not None:
        parsed = min(max_value, parsed)
    return parsed


def clamp_text(value, max_len):
    text = (value or "").strip()
    if len(text) > max_len:
        raise ValueError(f"text too long (>{max_len})")
    return text


def normalize_links(links):
    if not isinstance(links, list):
        raise ValueError("external_links must be an array")
    cleaned = []
    for item in links:
        if not isinstance(item, str):
            raise ValueError("external_links item must be string")
        txt = item.strip()
        if not txt:
            continue
        if len(txt) > 500:
            raise ValueError("link too long (>500)")
        cleaned.append(txt)
    if len(cleaned) > MAX_LINKS_PER_ANSWER:
        raise ValueError(f"too many links (max {MAX_LINKS_PER_ANSWER})")
    return cleaned


def rate_limit_check(bucket_key, limit_count, window_seconds):
    now_ts = time.time()
    with RATE_LIMIT_LOCK:
        items = RATE_LIMIT_BUCKET.get(bucket_key, [])
        items = [ts for ts in items if (now_ts - ts) < window_seconds]
        if len(items) >= limit_count:
            return False
        items.append(now_ts)
        RATE_LIMIT_BUCKET[bucket_key] = items
    return True


def load_quality_rules():
    global QUALITY_RULES, QUALITY_RULES_VERSION
    if not QUALITY_RULES_PATH.exists():
        QUALITY_RULES_PATH.write_text(
            json.dumps(DEFAULT_QUALITY_RULES, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
    try:
        payload = json.loads(QUALITY_RULES_PATH.read_text(encoding="utf-8"))
    except Exception:
        payload = DEFAULT_QUALITY_RULES
    rules = dict(DEFAULT_QUALITY_RULES)
    rules.update(payload if isinstance(payload, dict) else {})
    sim_rules = rules.get("similarity_penalty_rules", DEFAULT_QUALITY_RULES["similarity_penalty_rules"])
    if not isinstance(sim_rules, list):
        sim_rules = DEFAULT_QUALITY_RULES["similarity_penalty_rules"]
    rules["similarity_penalty_rules"] = sorted(
        [
            {
                "threshold": float(item.get("threshold", 0)),
                "penalty": float(item.get("penalty", 0)),
            }
            for item in sim_rules
            if isinstance(item, dict)
        ],
        key=lambda x: x["threshold"],
        reverse=True,
    )
    QUALITY_RULES = rules
    QUALITY_RULES_VERSION = utc_iso()
    return rules


def text_ngrams(text):
    normalized = re.sub(r"\s+", "", text.lower())
    if len(normalized) <= 2:
        return {normalized} if normalized else set()
    return {normalized[i : i + 2] for i in range(len(normalized) - 1)}


def jaccard_similarity(text_a, text_b):
    a = text_ngrams(text_a)
    b = text_ngrams(text_b)
    if not a or not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def is_valid_link(link):
    try:
        parsed = urlparse(link)
    except Exception:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    if not parsed.netloc:
        return False
    return True


def calc_answer_quality_score(conn, task_id, content, links):
    rules = QUALITY_RULES or load_quality_rules()
    score = float(rules["base_score"])
    details = {
        "rules_version": QUALITY_RULES_VERSION,
        "base_score": float(rules["base_score"]),
        "length_bonus": 0.0,
        "valid_link_bonus": 0.0,
        "invalid_link_penalty": 0.0,
        "duplicate_link_penalty": 0.0,
        "short_content_penalty": 0.0,
        "similarity_penalty": 0.0,
        "max_similarity": 0.0,
    }
    content_len = len(content.strip())
    max_chars = max(1, int(rules["length_max_chars"]))
    length_bonus = min(content_len, max_chars) / max_chars * float(rules["length_max_bonus"])
    score += length_bonus
    details["length_bonus"] = round(length_bonus, 2)

    valid_links = 0
    invalid_links = 0
    unique_links = len(set(links))
    for link in links:
        if is_valid_link(link):
            valid_links += 1
        else:
            invalid_links += 1
    valid_link_bonus = min(valid_links * float(rules["valid_link_bonus_per"]), float(rules["valid_link_bonus_cap"]))
    invalid_link_penalty = invalid_links * float(rules["invalid_link_penalty_per"])
    score += valid_link_bonus
    score -= invalid_link_penalty
    details["valid_link_bonus"] = round(valid_link_bonus, 2)
    details["invalid_link_penalty"] = round(invalid_link_penalty, 2)
    if len(links) > unique_links:
        score -= float(rules["duplicate_link_penalty"])
        details["duplicate_link_penalty"] = float(rules["duplicate_link_penalty"])

    if content_len < int(rules["short_content_threshold"]):
        score -= float(rules["short_content_penalty"])
        details["short_content_penalty"] = float(rules["short_content_penalty"])

    existing = conn.execute(
        """
        SELECT content FROM answers
        WHERE task_id = ? AND status = 'valid'
        ORDER BY created_at DESC
        LIMIT 50
        """,
        (task_id,),
    ).fetchall()
    max_sim = 0.0
    for row in existing:
        sim = jaccard_similarity(content, row["content"])
        if sim > max_sim:
            max_sim = sim
    details["max_similarity"] = round(max_sim, 4)
    for item in rules["similarity_penalty_rules"]:
        if max_sim >= float(item["threshold"]):
            score -= float(item["penalty"])
            details["similarity_penalty"] = float(item["penalty"])
            break

    final_score = max(0.0, min(100.0, round(score, 2)))
    details["final_score"] = final_score
    return final_score, details


def hash_password(password, salt=None):
    active_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        active_salt.encode("utf-8"),
        120000,
    ).hex()
    return f"{active_salt}${digest}"


def verify_password(password, password_hash):
    try:
        salt, _ = password_hash.split("$", 1)
    except ValueError:
        return False
    return hash_password(password, salt) == password_hash


def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    conn = get_conn()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              available_points INTEGER NOT NULL DEFAULT 0,
              frozen_points INTEGER NOT NULL DEFAULT 0,
              reputation_score INTEGER NOT NULL DEFAULT 60,
              is_admin INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'active',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              user_id INTEGER NOT NULL,
              expires_at TEXT NOT NULL,
              created_at TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              publisher_id INTEGER NOT NULL,
              title TEXT NOT NULL,
              description TEXT NOT NULL,
              acceptance_criteria TEXT NOT NULL,
              reward_points INTEGER NOT NULL,
              deadline_at TEXT,
              status TEXT NOT NULL DEFAULT 'open',
              best_answer_id INTEGER,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              settled_at TEXT,
              FOREIGN KEY (publisher_id) REFERENCES users(id),
              FOREIGN KEY (best_answer_id) REFERENCES answers(id)
            );

            CREATE TABLE IF NOT EXISTS answers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task_id INTEGER NOT NULL,
              author_id INTEGER NOT NULL,
              content TEXT NOT NULL,
              external_links TEXT,
              quality_meta TEXT,
              quality_score REAL NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'valid',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
              FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS point_transactions (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task_id INTEGER NOT NULL UNIQUE,
              payer_id INTEGER NOT NULL,
              payee_id INTEGER,
              amount INTEGER NOT NULL,
              status TEXT NOT NULL,
              settled_at TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS point_ledger (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              biz_type TEXT NOT NULL,
              delta_available INTEGER NOT NULL,
              delta_frozen INTEGER NOT NULL,
              available_after INTEGER NOT NULL,
              frozen_after INTEGER NOT NULL,
              ref_type TEXT NOT NULL,
              ref_id INTEGER,
              remark TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reports (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              reporter_id INTEGER NOT NULL,
              target_type TEXT NOT NULL,
              target_id INTEGER NOT NULL,
              reason TEXT NOT NULL,
              evidence TEXT,
              status TEXT NOT NULL DEFAULT 'pending',
              created_at TEXT NOT NULL,
              handled_at TEXT,
              handler_id INTEGER,
              FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              operator_id INTEGER,
              action TEXT NOT NULL,
              target_type TEXT NOT NULL,
              target_id INTEGER,
              before_data TEXT,
              after_data TEXT,
              created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_tasks_status_created
            ON tasks(status, created_at DESC);

            CREATE INDEX IF NOT EXISTS idx_answers_task_created
            ON answers(task_id, created_at);

            CREATE INDEX IF NOT EXISTS idx_ledger_user_created
            ON point_ledger(user_id, created_at DESC);

            CREATE INDEX IF NOT EXISTS idx_reports_status_created
            ON reports(status, created_at DESC);
            """
        )
        ensure_column(conn, "users", "is_admin", "INTEGER NOT NULL DEFAULT 0")
        ensure_column(conn, "reports", "decision_note", "TEXT")
        ensure_column(conn, "answers", "quality_meta", "TEXT")
        conn.commit()
    finally:
        conn.close()


def ensure_column(conn, table, column, ddl):
    existing = conn.execute(f"PRAGMA table_info({table})").fetchall()
    if any(row["name"] == column for row in existing):
        return
    conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}")


def add_ledger(conn, user_id, biz_type, delta_available, delta_frozen, ref_type, ref_id, remark):
    user = conn.execute(
        "SELECT available_points, frozen_points FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if not user:
        raise ValueError("user not found")
    available_after = user["available_points"] + delta_available
    frozen_after = user["frozen_points"] + delta_frozen
    if available_after < 0 or frozen_after < 0:
        raise ValueError("insufficient points")
    conn.execute(
        """
        UPDATE users SET available_points = ?, frozen_points = ?, updated_at = ?
        WHERE id = ?
        """,
        (available_after, frozen_after, utc_iso(), user_id),
    )
    conn.execute(
        """
        INSERT INTO point_ledger (
          user_id, biz_type, delta_available, delta_frozen, available_after, frozen_after,
          ref_type, ref_id, remark, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            biz_type,
            delta_available,
            delta_frozen,
            available_after,
            frozen_after,
            ref_type,
            ref_id,
            remark,
            utc_iso(),
        ),
    )


def adjust_reputation(conn, user_id, delta, reason, ref_type, ref_id, operator_id=None):
    user = conn.execute(
        "SELECT reputation_score FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if not user:
        return
    before = user["reputation_score"]
    after = max(REPUTATION_MIN, min(REPUTATION_MAX, before + delta))
    if after == before:
        return
    conn.execute(
        "UPDATE users SET reputation_score = ?, updated_at = ? WHERE id = ?",
        (after, utc_iso(), user_id),
    )
    conn.execute(
        """
        INSERT INTO audit_logs(operator_id, action, target_type, target_id, before_data, after_data, created_at)
        VALUES (?, 'adjust_reputation', 'user', ?, ?, ?, ?)
        """,
        (
            operator_id,
            user_id,
            json.dumps({"score": before, "reason": reason, "ref_type": ref_type, "ref_id": ref_id}, ensure_ascii=False),
            json.dumps({"score": after}, ensure_ascii=False),
            utc_iso(),
        ),
    )


def apply_content_rules(text):
    blocked_words = ["盗版", "破解", "网盘直链", "BT下载", "资源打包下载"]
    lowered = text.lower()
    for word in blocked_words:
        if word in text or word.lower() in lowered:
            return False, f"包含敏感词: {word}"
    return True, ""


def create_session(conn, user_id):
    token = secrets.token_urlsafe(32)
    conn.execute(
        """
        INSERT INTO sessions(token, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (token, user_id, utc_iso(utc_now() + timedelta(hours=SESSION_HOURS)), utc_iso()),
    )
    return token


def user_from_token(conn, token):
    if not token:
        return None
    row = conn.execute(
        """
        SELECT u.*
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > ?
        """,
        (token, utc_iso()),
    ).fetchone()
    return row


def ensure_active_user(user):
    if user and user["status"] != "active":
        raise PermissionError("user is banned")


def ensure_user(conn, username, password, is_admin=False, available_points=300):
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        return existing["id"]
    now = utc_iso()
    conn.execute(
        """
        INSERT INTO users(
          username, password_hash, available_points, frozen_points,
          reputation_score, is_admin, status, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 60, ?, 'active', ?, ?)
        """,
        (
            username,
            hash_password(password),
            available_points,
            1 if is_admin else 0,
            now,
            now,
        ),
    )
    return conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]


def create_seed_task(conn, publisher_id, title, description, criteria, reward_points):
    now = utc_iso()
    conn.execute(
        """
        INSERT INTO tasks(
          publisher_id, title, description, acceptance_criteria,
          reward_points, deadline_at, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'open', ?, ?)
        """,
        (publisher_id, title, description, criteria, reward_points, now, now),
    )
    task_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
    add_ledger(
        conn,
        publisher_id,
        "freeze_task_reward",
        -reward_points,
        reward_points,
        "task",
        task_id,
        "seed demo task",
    )
    conn.execute(
        """
        INSERT INTO point_transactions(task_id, payer_id, payee_id, amount, status, created_at)
        VALUES (?, ?, NULL, ?, 'frozen', ?)
        """,
        (task_id, publisher_id, reward_points, now),
    )
    return task_id


def create_seed_answer(conn, task_id, author_id, content):
    score, meta = calc_answer_quality_score(conn, task_id, content, ["https://ocw.mit.edu"])
    now = utc_iso()
    conn.execute(
        """
        INSERT INTO answers(
          task_id, author_id, content, external_links, quality_meta, quality_score,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'valid', ?, ?)
        """,
        (
            task_id,
            author_id,
            content,
            json.dumps(["https://ocw.mit.edu"], ensure_ascii=False),
            json.dumps(meta, ensure_ascii=False),
            score,
            now,
            now,
        ),
    )


def init_demo_data(conn):
    admin_id = ensure_user(conn, "admin_demo", "admin123", is_admin=True, available_points=500)
    publisher_id = ensure_user(conn, "publisher_demo", "publisher123", available_points=500)
    helper_id = ensure_user(conn, "helper_demo", "helper123", available_points=300)
    title = "求 Python 学习资料合法路径（demo）"
    exists = conn.execute(
        "SELECT id FROM tasks WHERE title = ? AND publisher_id = ? LIMIT 1",
        (title, publisher_id),
    ).fetchone()
    if exists:
        return {"task_id": exists["id"], "created": False}
    task_id = create_seed_task(
        conn,
        publisher_id,
        title,
        "需要公开课程与教材检索路径，避免盗版。",
        "至少提供3条可执行路径",
        30,
    )
    create_seed_answer(conn, task_id, helper_id, "建议先看公开课平台，再配合出版社目录与图书馆检索。")
    create_seed_answer(conn, task_id, admin_id, "可以先梳理关键词，再去公开课程站做二次检索。")
    return {"task_id": task_id, "created": True}


def settle_task(conn, task_id, answer_id, auto=False, operator_id=None):
    task = conn.execute(
        "SELECT * FROM tasks WHERE id = ?",
        (task_id,),
    ).fetchone()
    if not task:
        raise ValueError("task not found")
    if task["status"] != "open":
        raise ValueError("task already settled or closed")

    answer = conn.execute(
        """
        SELECT * FROM answers
        WHERE id = ? AND task_id = ? AND status = 'valid'
        """,
        (answer_id, task_id),
    ).fetchone()
    if not answer:
        raise ValueError("answer not found or invalid")

    reward_points = task["reward_points"]
    publisher_id = task["publisher_id"]
    winner_id = answer["author_id"]
    if winner_id == publisher_id:
        raise ValueError("publisher cannot select self answer")

    add_ledger(
        conn,
        publisher_id,
        "settle_task",
        0,
        -reward_points,
        "task",
        task_id,
        "任务结算释放冻结积分",
    )
    add_ledger(
        conn,
        winner_id,
        "task_reward",
        reward_points,
        0,
        "task",
        task_id,
        "获得最佳答案积分奖励",
    )

    conn.execute(
        """
        UPDATE tasks
        SET status = ?, best_answer_id = ?, settled_at = ?, updated_at = ?
        WHERE id = ?
        """,
        ("auto_settled" if auto else "closed", answer_id, utc_iso(), utc_iso(), task_id),
    )
    conn.execute(
        """
        UPDATE point_transactions
        SET payee_id = ?, status = 'paid', settled_at = ?
        WHERE task_id = ?
        """,
        (winner_id, utc_iso(), task_id),
    )
    conn.execute(
        """
        INSERT INTO audit_logs(operator_id, action, target_type, target_id, before_data, after_data, created_at)
        VALUES (?, ?, 'task', ?, ?, ?, ?)
        """,
        (
            operator_id,
            "auto_settle_task" if auto else "settle_task",
            task_id,
            json.dumps({"status": task["status"], "best_answer_id": task["best_answer_id"]}, ensure_ascii=False),
            json.dumps({"status": "auto_settled" if auto else "closed", "best_answer_id": answer_id}, ensure_ascii=False),
            utc_iso(),
        ),
    )
    adjust_reputation(conn, winner_id, 5, "answer_selected_best", "task", task_id, operator_id=operator_id)
    adjust_reputation(conn, publisher_id, 1, "task_completed", "task", task_id, operator_id=operator_id)


def auto_settle_loop():
    while True:
        time.sleep(AUTO_SETTLE_INTERVAL_SECONDS)
        with DB_LOCK:
            conn = get_conn()
            try:
                cutoff = utc_now() - timedelta(hours=AUTO_SETTLE_HOURS)
                tasks = conn.execute(
                    """
                    SELECT id
                    FROM tasks
                    WHERE status = 'open' AND created_at <= ?
                    """,
                    (utc_iso(cutoff),),
                ).fetchall()
                for row in tasks:
                    task_id = row["id"]
                    best = conn.execute(
                        """
                        SELECT id
                        FROM answers
                        WHERE task_id = ? AND status = 'valid'
                        ORDER BY created_at ASC
                        LIMIT 1
                        """,
                        (task_id,),
                    ).fetchone()
                    if not best:
                        continue
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        settle_task(conn, task_id, best["id"], auto=True, operator_id=None)
                        conn.commit()
                    except Exception:
                        conn.rollback()
            finally:
                conn.close()


class AppHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def send_json(self, code, payload):
        raw = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def send_api_error(self, http_code, message, error_code):
        self.send_json(
            http_code,
            {
                "ok": False,
                "error": message,
                "error_code": error_code,
                "version": APP_VERSION,
            },
        )

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > MAX_BODY_BYTES:
            return {"__body_too_large__": True}
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        try:
            return json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            return {"__invalid_json__": True}

    def auth_user(self, conn):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth.removeprefix("Bearer ").strip()
        return user_from_token(conn, token)

    def serve_static(self):
        parsed = urlparse(self.path)
        route = parsed.path
        if route == "/":
            file_path = STATIC_DIR / "index.html"
        else:
            file_path = (STATIC_DIR / route.lstrip("/")).resolve()
            if not str(file_path).startswith(str(STATIC_DIR.resolve())):
                self.send_json(403, {"error": "forbidden"})
                return
        if not file_path.exists() or not file_path.is_file():
            self.send_json(404, {"error": "not found"})
            return
        ext = file_path.suffix
        content_type = "text/plain; charset=utf-8"
        if ext == ".html":
            content_type = "text/html; charset=utf-8"
        elif ext == ".css":
            content_type = "text/css; charset=utf-8"
        elif ext == ".js":
            content_type = "application/javascript; charset=utf-8"
        data = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            self.serve_static()
            return

        with DB_LOCK:
            conn = get_conn()
            try:
                user = self.auth_user(conn)
                if user:
                    try:
                        ensure_active_user(user)
                    except PermissionError as err:
                        return self.send_api_error(403, str(err), "USER_BANNED")
                if parsed.path == "/api/health":
                    return self.send_json(200, {"ok": True, "time": utc_iso(), "version": APP_VERSION})

                if parsed.path == "/api/version":
                    return self.send_json(200, {"ok": True, "version": APP_VERSION})

                if parsed.path == "/api/tasks":
                    query = parse_qs(parsed.query)
                    status = query.get("status", ["open"])[0].strip()
                    keyword = query.get("q", [""])[0].strip()
                    min_reward = parse_int(query.get("min_reward", [None])[0], 0, 0, 10**9)
                    max_reward = parse_int(query.get("max_reward", [None])[0], 10**9, 0, 10**9)
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [10])[0], 10, 1, 50)
                    sort = query.get("sort", ["created_desc"])[0]

                    where_clauses = []
                    params = []
                    if status != "all":
                        where_clauses.append("t.status = ?")
                        params.append(status)
                    if keyword:
                        where_clauses.append("(t.title LIKE ? OR t.description LIKE ?)")
                        like = f"%{keyword}%"
                        params.extend([like, like])
                    where_clauses.append("t.reward_points >= ?")
                    params.append(min_reward)
                    where_clauses.append("t.reward_points <= ?")
                    params.append(max_reward)
                    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

                    order_sql = "t.created_at DESC"
                    if sort == "created_asc":
                        order_sql = "t.created_at ASC"
                    elif sort == "reward_desc":
                        order_sql = "t.reward_points DESC, t.created_at DESC"
                    elif sort == "reward_asc":
                        order_sql = "t.reward_points ASC, t.created_at DESC"

                    total = conn.execute(
                        f"""
                        SELECT COUNT(1) AS total
                        FROM tasks t
                        WHERE {where_sql}
                        """,
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT t.*, u.username AS publisher_name
                        FROM tasks t
                        JOIN users u ON u.id = t.publisher_id
                        WHERE {where_sql}
                        ORDER BY {order_sql}
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "tasks": [dict(row) for row in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                if parsed.path.startswith("/api/tasks/"):
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) == 3 and parts[0] == "api" and parts[1] == "tasks":
                        task_id = int(parts[2])
                        query = parse_qs(parsed.query)
                        answer_page = parse_int(query.get("answer_page", [1])[0], 1, 1, 10**6)
                        answer_page_size = parse_int(query.get("answer_page_size", [10])[0], 10, 1, 50)
                        answer_sort = query.get("answer_sort", ["created_asc"])[0]
                        task = conn.execute(
                            """
                            SELECT t.*, u.username AS publisher_name
                            FROM tasks t
                            JOIN users u ON u.id = t.publisher_id
                            WHERE t.id = ?
                            """,
                            (task_id,),
                        ).fetchone()
                        if not task:
                            return self.send_api_error(404, "task not found", "TASK_NOT_FOUND")
                        answer_order = "a.created_at ASC"
                        if answer_sort == "created_desc":
                            answer_order = "a.created_at DESC"
                        elif answer_sort == "quality_desc":
                            answer_order = "a.quality_score DESC, a.created_at ASC"
                        elif answer_sort == "quality_asc":
                            answer_order = "a.quality_score ASC, a.created_at ASC"
                        answers_total = conn.execute(
                            "SELECT COUNT(1) AS total FROM answers WHERE task_id = ?",
                            (task_id,),
                        ).fetchone()["total"]
                        answer_offset = (answer_page - 1) * answer_page_size
                        answers = conn.execute(
                            f"""
                            SELECT a.*, u.username AS author_name
                            FROM answers a
                            JOIN users u ON u.id = a.author_id
                            WHERE a.task_id = ?
                            ORDER BY {answer_order}
                            LIMIT ? OFFSET ?
                            """,
                            (task_id, answer_page_size, answer_offset),
                        ).fetchall()
                        answer_items = []
                        for row in answers:
                            item = dict(row)
                            try:
                                item["external_links"] = json.loads(item.get("external_links") or "[]")
                            except json.JSONDecodeError:
                                item["external_links"] = []
                            try:
                                item["quality_meta"] = json.loads(item.get("quality_meta") or "{}")
                            except json.JSONDecodeError:
                                item["quality_meta"] = {}
                            answer_items.append(item)
                        return self.send_json(
                            200,
                            {
                                "task": dict(task),
                                "answers": answer_items,
                                "answers_pagination": {
                                    "total": answers_total,
                                    "page": answer_page,
                                    "page_size": answer_page_size,
                                    "has_next": (answer_offset + len(answers)) < answers_total,
                                },
                                "viewer_id": user["id"] if user else None,
                            },
                        )

                if parsed.path == "/api/me":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    return self.send_json(
                        200,
                        {
                            "user": {
                                "id": user["id"],
                                "username": user["username"],
                                "available_points": user["available_points"],
                                "frozen_points": user["frozen_points"],
                                "reputation_score": user["reputation_score"],
                                "is_admin": bool(user["is_admin"]),
                            }
                        },
                    )

                if parsed.path == "/api/me/tasks/published":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    query = parse_qs(parsed.query)
                    status = query.get("status", ["all"])[0].strip()
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [10])[0], 10, 1, 50)
                    where_sql = "publisher_id = ?"
                    params = [user["id"]]
                    if status != "all":
                        where_sql += " AND status = ?"
                        params.append(status)
                    total = conn.execute(
                        f"SELECT COUNT(1) AS total FROM tasks WHERE {where_sql}",
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT *
                        FROM tasks
                        WHERE {where_sql}
                        ORDER BY created_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "tasks": [dict(row) for row in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                if parsed.path == "/api/me/tasks/answered":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    query = parse_qs(parsed.query)
                    status = query.get("status", ["all"])[0].strip()
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [10])[0], 10, 1, 50)
                    where_sql = "a.author_id = ?"
                    params = [user["id"]]
                    if status != "all":
                        where_sql += " AND t.status = ?"
                        params.append(status)
                    total = conn.execute(
                        f"""
                        SELECT COUNT(DISTINCT t.id) AS total
                        FROM tasks t
                        JOIN answers a ON a.task_id = t.id
                        WHERE {where_sql}
                        """,
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT DISTINCT t.*
                        FROM tasks t
                        JOIN answers a ON a.task_id = t.id
                        WHERE {where_sql}
                        ORDER BY t.created_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "tasks": [dict(row) for row in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                if parsed.path == "/api/me/points":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    return self.send_json(
                        200,
                        {
                            "available_points": user["available_points"],
                            "frozen_points": user["frozen_points"],
                            "reputation_score": user["reputation_score"],
                        },
                    )

                if parsed.path == "/api/me/points/ledger":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    rows = conn.execute(
                        """
                        SELECT *
                        FROM point_ledger
                        WHERE user_id = ?
                        ORDER BY created_at DESC
                        LIMIT 100
                        """,
                        (user["id"],),
                    ).fetchall()
                    return self.send_json(200, {"ledger": [dict(row) for row in rows]})

                if parsed.path == "/api/admin/reports":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    query = parse_qs(parsed.query)
                    status = query.get("status", ["pending"])[0].strip()
                    target_type = query.get("target_type", ["all"])[0].strip()
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [10])[0], 10, 1, 50)

                    where_clauses = []
                    params = []
                    if status != "all":
                        where_clauses.append("r.status = ?")
                        params.append(status)
                    if target_type != "all":
                        where_clauses.append("r.target_type = ?")
                        params.append(target_type)
                    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

                    total = conn.execute(
                        f"""
                        SELECT COUNT(1) AS total
                        FROM reports r
                        WHERE {where_sql}
                        """,
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT r.*, u.username AS reporter_name
                        FROM reports r
                        JOIN users u ON u.id = r.reporter_id
                        WHERE {where_sql}
                        ORDER BY r.created_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "reports": [dict(row) for row in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                if parsed.path == "/api/admin/quality-config":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    return self.send_json(
                        200,
                        {
                            "quality_rules": QUALITY_RULES,
                            "rules_version": QUALITY_RULES_VERSION,
                            "path": str(QUALITY_RULES_PATH),
                        },
                    )

                if parsed.path == "/api/admin/users":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    query = parse_qs(parsed.query)
                    status = query.get("status", ["all"])[0].strip()
                    keyword = query.get("q", [""])[0].strip()
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [10])[0], 10, 1, 50)
                    where_clauses = ["1=1"]
                    params = []
                    if status != "all":
                        where_clauses.append("u.status = ?")
                        params.append(status)
                    if keyword:
                        where_clauses.append("u.username LIKE ?")
                        params.append(f"%{keyword}%")
                    where_sql = " AND ".join(where_clauses)
                    total = conn.execute(
                        f"SELECT COUNT(1) AS total FROM users u WHERE {where_sql}",
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT
                          u.id, u.username, u.status, u.is_admin, u.reputation_score,
                          u.available_points, u.frozen_points, u.created_at
                        FROM users u
                        WHERE {where_sql}
                        ORDER BY u.created_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "users": [dict(row) for row in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                if parsed.path == "/api/admin/system/stats":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    users_total = conn.execute("SELECT COUNT(1) AS c FROM users").fetchone()["c"]
                    tasks_total = conn.execute("SELECT COUNT(1) AS c FROM tasks").fetchone()["c"]
                    open_tasks = conn.execute("SELECT COUNT(1) AS c FROM tasks WHERE status = 'open'").fetchone()["c"]
                    answers_total = conn.execute("SELECT COUNT(1) AS c FROM answers").fetchone()["c"]
                    reports_pending = conn.execute(
                        "SELECT COUNT(1) AS c FROM reports WHERE status = 'pending'"
                    ).fetchone()["c"]
                    banned_users = conn.execute(
                        "SELECT COUNT(1) AS c FROM users WHERE status = 'banned'"
                    ).fetchone()["c"]
                    return self.send_json(
                        200,
                        {
                            "stats": {
                                "users_total": users_total,
                                "banned_users": banned_users,
                                "tasks_total": tasks_total,
                                "open_tasks": open_tasks,
                                "answers_total": answers_total,
                                "reports_pending": reports_pending,
                            },
                            "generated_at": utc_iso(),
                        },
                    )

                if parsed.path == "/api/admin/audit-logs":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    query = parse_qs(parsed.query)
                    action = query.get("action", ["all"])[0].strip()
                    target_type = query.get("target_type", ["all"])[0].strip()
                    page = parse_int(query.get("page", [1])[0], 1, 1, 10**6)
                    page_size = parse_int(query.get("page_size", [20])[0], 20, 1, 100)
                    where = ["1=1"]
                    params = []
                    if action != "all":
                        where.append("a.action = ?")
                        params.append(action)
                    if target_type != "all":
                        where.append("a.target_type = ?")
                        params.append(target_type)
                    where_sql = " AND ".join(where)
                    total = conn.execute(
                        f"SELECT COUNT(1) AS total FROM audit_logs a WHERE {where_sql}",
                        tuple(params),
                    ).fetchone()["total"]
                    offset = (page - 1) * page_size
                    rows = conn.execute(
                        f"""
                        SELECT a.*, u.username AS operator_name
                        FROM audit_logs a
                        LEFT JOIN users u ON u.id = a.operator_id
                        WHERE {where_sql}
                        ORDER BY a.created_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        tuple(params + [page_size, offset]),
                    ).fetchall()
                    return self.send_json(
                        200,
                        {
                            "ok": True,
                            "logs": [dict(r) for r in rows],
                            "pagination": {
                                "total": total,
                                "page": page,
                                "page_size": page_size,
                                "has_next": (offset + len(rows)) < total,
                            },
                        },
                    )

                return self.send_api_error(404, "not found", "NOT_FOUND")
            finally:
                conn.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            return self.send_api_error(404, "not found", "NOT_FOUND")

        with DB_LOCK:
            conn = get_conn()
            try:
                body = self.read_json()
                if body.get("__body_too_large__"):
                    return self.send_api_error(413, "request body too large", "BODY_TOO_LARGE")
                if body.get("__invalid_json__"):
                    return self.send_api_error(400, "invalid json body", "INVALID_JSON")
                user = self.auth_user(conn)
                if user:
                    try:
                        ensure_active_user(user)
                    except PermissionError as err:
                        return self.send_api_error(403, str(err), "USER_BANNED")

                if parsed.path == "/api/register":
                    client_ip = self.client_address[0] if self.client_address else "unknown"
                    if not rate_limit_check(f"register:{client_ip}", 10, 60):
                        return self.send_api_error(429, "too many register attempts", "RATE_LIMIT_REGISTER")
                    try:
                        username = clamp_text(body.get("username"), MAX_USERNAME_LEN)
                        password = (body.get("password") or "").strip()
                    except ValueError as err:
                        return self.send_api_error(400, str(err), "INVALID_INPUT")
                    if len(username) < 3 or len(password) < 6 or len(password) > 128:
                        return self.send_api_error(400, "username>=3, password 6-128", "INVALID_INPUT")
                    exists = conn.execute(
                        "SELECT id FROM users WHERE username = ?",
                        (username,),
                    ).fetchone()
                    if exists:
                        return self.send_api_error(409, "username exists", "USERNAME_EXISTS")
                    admin_exists = conn.execute(
                        "SELECT id FROM users WHERE is_admin = 1 LIMIT 1"
                    ).fetchone()
                    grant_admin = 1 if (not admin_exists or username.lower().startswith("admin")) else 0
                    now = utc_iso()
                    conn.execute(
                        """
                        INSERT INTO users(
                          username, password_hash, available_points, frozen_points,
                          reputation_score, is_admin, status, created_at, updated_at
                        ) VALUES (?, ?, ?, 0, 60, ?, 'active', ?, ?)
                        """,
                        (
                            username,
                            hash_password(password),
                            DEFAULT_REGISTER_POINTS,
                            grant_admin,
                            now,
                            now,
                        ),
                    )
                    user_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
                    token = create_session(conn, user_id)
                    conn.commit()
                    return self.send_json(
                        201,
                        {"token": token, "user_id": user_id, "gift_points": DEFAULT_REGISTER_POINTS},
                    )

                if parsed.path == "/api/login":
                    client_ip = self.client_address[0] if self.client_address else "unknown"
                    if not rate_limit_check(f"login:{client_ip}", 30, 60):
                        return self.send_api_error(429, "too many login attempts", "RATE_LIMIT_LOGIN")
                    username = (body.get("username") or "").strip()
                    password = (body.get("password") or "").strip()
                    row = conn.execute(
                        "SELECT * FROM users WHERE username = ?",
                        (username,),
                    ).fetchone()
                    if not row or not verify_password(password, row["password_hash"]):
                        return self.send_api_error(401, "invalid credentials", "INVALID_CREDENTIALS")
                    if row["status"] != "active":
                        return self.send_api_error(403, "user is banned", "USER_BANNED")
                    token = create_session(conn, row["id"])
                    conn.commit()
                    return self.send_json(200, {"token": token, "user_id": row["id"]})

                if parsed.path == "/api/tasks":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    if not rate_limit_check(f"task_create:{user['id']}", 20, 60):
                        return self.send_api_error(429, "too many task creates", "RATE_LIMIT_TASK_CREATE")
                    try:
                        title = clamp_text(body.get("title"), MAX_TITLE_LEN)
                        description = clamp_text(body.get("description"), MAX_DESC_LEN)
                        criteria = clamp_text(body.get("acceptance_criteria"), MAX_CRITERIA_LEN)
                    except ValueError as err:
                        return self.send_api_error(400, str(err), "INVALID_INPUT")
                    reward_points = parse_int(body.get("reward_points"), 0, 0, 10**9)
                    deadline_at = body.get("deadline_at") or None
                    if not title or not description or not criteria:
                        return self.send_api_error(400, "title/description/acceptance_criteria required", "INVALID_INPUT")
                    if reward_points < 10:
                        return self.send_api_error(400, "reward_points must be >= 10", "INVALID_INPUT")
                    allowed, reason = apply_content_rules(f"{title}\n{description}\n{criteria}")
                    if not allowed:
                        return self.send_api_error(400, reason, "CONTENT_BLOCKED")
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        add_ledger(
                            conn,
                            user["id"],
                            "freeze_task_reward",
                            -reward_points,
                            reward_points,
                            "task",
                            None,
                            "发布任务冻结积分",
                        )
                        now = utc_iso()
                        conn.execute(
                            """
                            INSERT INTO tasks(
                              publisher_id, title, description, acceptance_criteria,
                              reward_points, deadline_at, status, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)
                            """,
                            (
                                user["id"],
                                title,
                                description,
                                criteria,
                                reward_points,
                                deadline_at,
                                now,
                                now,
                            ),
                        )
                        task_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
                        conn.execute(
                            """
                            UPDATE point_ledger
                            SET ref_id = ?
                            WHERE id = (SELECT MAX(id) FROM point_ledger WHERE user_id = ?)
                            """,
                            (task_id, user["id"]),
                        )
                        conn.execute(
                            """
                            INSERT INTO point_transactions(task_id, payer_id, payee_id, amount, status, created_at)
                            VALUES (?, ?, NULL, ?, 'frozen', ?)
                            """,
                            (task_id, user["id"], reward_points, now),
                        )
                        conn.commit()
                        return self.send_json(201, {"task_id": task_id})
                    except ValueError as err:
                        conn.rollback()
                        return self.send_api_error(400, str(err), "INVALID_INPUT")
                    except Exception:
                        conn.rollback()
                        return self.send_api_error(500, "create task failed", "INTERNAL_ERROR")

                if parsed.path.startswith("/api/tasks/") and parsed.path.endswith("/answers"):
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    if not rate_limit_check(f"answer_create:{user['id']}", 40, 60):
                        return self.send_api_error(429, "too many answer submits", "RATE_LIMIT_ANSWER_CREATE")
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 4:
                        return self.send_api_error(404, "not found", "NOT_FOUND")
                    task_id = int(parts[2])
                    try:
                        content = clamp_text(body.get("content"), MAX_ANSWER_LEN)
                        links = normalize_links(body.get("external_links") or [])
                    except ValueError as err:
                        return self.send_api_error(400, str(err), "INVALID_INPUT")
                    if not content:
                        return self.send_api_error(400, "content required", "INVALID_INPUT")
                    links_json = json.dumps(links, ensure_ascii=False)
                    allowed, reason = apply_content_rules(content + links_json)
                    if not allowed:
                        return self.send_api_error(400, reason, "CONTENT_BLOCKED")
                    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
                    if not task or task["status"] != "open":
                        return self.send_api_error(400, "task not open", "TASK_NOT_OPEN")
                    if task["publisher_id"] == user["id"]:
                        return self.send_api_error(400, "publisher cannot answer own task", "INVALID_OPERATION")
                    quality_score, quality_meta = calc_answer_quality_score(conn, task_id, content, links)
                    now = utc_iso()
                    conn.execute(
                        """
                        INSERT INTO answers(
                          task_id, author_id, content, external_links, quality_meta,
                          quality_score, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, 'valid', ?, ?)
                        """,
                        (
                            task_id,
                            user["id"],
                            content,
                            links_json,
                            json.dumps(quality_meta, ensure_ascii=False),
                            quality_score,
                            now,
                            now,
                        ),
                    )
                    answer_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
                    conn.commit()
                    return self.send_json(
                        201,
                        {
                            "answer_id": answer_id,
                            "quality_score": quality_score,
                            "quality_meta": quality_meta,
                        },
                    )

                if parsed.path.startswith("/api/tasks/") and parsed.path.endswith("/select-best"):
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 4:
                        return self.send_api_error(404, "not found", "NOT_FOUND")
                    task_id = int(parts[2])
                    answer_id = int(body.get("answer_id") or 0)
                    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
                    if not task:
                        return self.send_api_error(404, "task not found", "TASK_NOT_FOUND")
                    if task["publisher_id"] != user["id"]:
                        return self.send_api_error(403, "not task publisher", "FORBIDDEN")
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        settle_task(conn, task_id, answer_id, auto=False, operator_id=user["id"])
                        conn.commit()
                        return self.send_json(200, {"ok": True})
                    except ValueError as err:
                        conn.rollback()
                        return self.send_api_error(400, str(err), "INVALID_OPERATION")
                    except Exception:
                        conn.rollback()
                        return self.send_api_error(500, "settle failed", "INTERNAL_ERROR")

                if parsed.path == "/api/reports":
                    if not user:
                        return self.send_api_error(401, "unauthorized", "UNAUTHORIZED")
                    if not rate_limit_check(f"report_create:{user['id']}", 30, 60):
                        return self.send_api_error(429, "too many reports", "RATE_LIMIT_REPORT_CREATE")
                    target_type = (body.get("target_type") or "").strip()
                    target_id = int(body.get("target_id") or 0)
                    try:
                        reason = clamp_text(body.get("reason"), MAX_REASON_LEN)
                        evidence = clamp_text(body.get("evidence"), MAX_EVIDENCE_LEN)
                    except ValueError as err:
                        return self.send_api_error(400, str(err), "INVALID_INPUT")
                    if target_type not in {"task", "answer", "user"}:
                        return self.send_api_error(400, "invalid target_type", "INVALID_INPUT")
                    if target_id <= 0 or not reason:
                        return self.send_api_error(400, "target_id/reason required", "INVALID_INPUT")
                    conn.execute(
                        """
                        INSERT INTO reports(reporter_id, target_type, target_id, reason, evidence, status, created_at)
                        VALUES (?, ?, ?, ?, ?, 'pending', ?)
                        """,
                        (user["id"], target_type, target_id, reason, evidence, utc_iso()),
                    )
                    report_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
                    conn.commit()
                    return self.send_json(201, {"report_id": report_id})

                if parsed.path.startswith("/api/admin/reports/") and parsed.path.endswith("/resolve"):
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 5:
                        return self.send_api_error(404, "not found", "NOT_FOUND")
                    try:
                        report_id = int(parts[3])
                    except ValueError:
                        return self.send_api_error(400, "invalid report id", "INVALID_INPUT")
                    decision = (body.get("decision") or "").strip()
                    note = (body.get("note") or "").strip()
                    if decision not in {"approved", "rejected"}:
                        return self.send_api_error(400, "decision must be approved/rejected", "INVALID_INPUT")
                    report = conn.execute(
                        "SELECT * FROM reports WHERE id = ?",
                        (report_id,),
                    ).fetchone()
                    if not report:
                        return self.send_api_error(404, "report not found", "REPORT_NOT_FOUND")
                    if report["status"] != "pending":
                        return self.send_api_error(400, "report already resolved", "INVALID_OPERATION")
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        conn.execute(
                            """
                            UPDATE reports
                            SET status = ?, handled_at = ?, handler_id = ?, decision_note = ?
                            WHERE id = ?
                            """,
                            (decision, utc_iso(), user["id"], note, report_id),
                        )
                        punished_user_id = None
                        if decision == "approved":
                            if report["target_type"] == "answer":
                                target = conn.execute(
                                    "SELECT id, author_id FROM answers WHERE id = ?",
                                    (report["target_id"],),
                                ).fetchone()
                                if target:
                                    punished_user_id = target["author_id"]
                                    conn.execute(
                                        "UPDATE answers SET status = 'hidden', updated_at = ? WHERE id = ?",
                                        (utc_iso(), target["id"]),
                                    )
                            elif report["target_type"] == "task":
                                target = conn.execute(
                                    "SELECT publisher_id FROM tasks WHERE id = ?",
                                    (report["target_id"],),
                                ).fetchone()
                                if target:
                                    punished_user_id = target["publisher_id"]
                            elif report["target_type"] == "user":
                                target = conn.execute(
                                    "SELECT id FROM users WHERE id = ?",
                                    (report["target_id"],),
                                ).fetchone()
                                if target:
                                    punished_user_id = target["id"]
                            if punished_user_id:
                                adjust_reputation(
                                    conn,
                                    punished_user_id,
                                    -10,
                                    "report_approved",
                                    report["target_type"],
                                    report["target_id"],
                                    operator_id=user["id"],
                                )
                                adjust_reputation(
                                    conn,
                                    report["reporter_id"],
                                    2,
                                    "report_effective",
                                    "report",
                                    report_id,
                                    operator_id=user["id"],
                                )
                        conn.execute(
                            """
                            INSERT INTO audit_logs(operator_id, action, target_type, target_id, before_data, after_data, created_at)
                            VALUES (?, 'resolve_report', 'report', ?, ?, ?, ?)
                            """,
                            (
                                user["id"],
                                report_id,
                                json.dumps({"status": report["status"]}, ensure_ascii=False),
                                json.dumps({"status": decision, "note": note}, ensure_ascii=False),
                                utc_iso(),
                            ),
                        )
                        conn.commit()
                        return self.send_json(200, {"ok": True, "status": decision})
                    except Exception as err:
                        conn.rollback()
                        return self.send_api_error(500, f"resolve report failed: {err}", "INTERNAL_ERROR")

                if parsed.path == "/api/admin/quality-config/reload":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    rules = load_quality_rules()
                    return self.send_json(
                        200,
                        {
                            "ok": True,
                            "quality_rules": rules,
                            "rules_version": QUALITY_RULES_VERSION,
                        },
                    )

                if parsed.path.startswith("/api/admin/users/") and parsed.path.endswith("/status"):
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 5:
                        return self.send_api_error(404, "not found", "NOT_FOUND")
                    try:
                        target_user_id = int(parts[3])
                    except ValueError:
                        return self.send_api_error(400, "invalid user id", "INVALID_INPUT")
                    target_status = (body.get("status") or "").strip()
                    note = (body.get("note") or "").strip()
                    if target_status not in {"active", "banned"}:
                        return self.send_api_error(400, "status must be active/banned", "INVALID_INPUT")
                    if target_user_id == user["id"] and target_status != "active":
                        return self.send_api_error(400, "cannot ban self", "INVALID_OPERATION")
                    target = conn.execute(
                        "SELECT id, status FROM users WHERE id = ?",
                        (target_user_id,),
                    ).fetchone()
                    if not target:
                        return self.send_api_error(404, "user not found", "USER_NOT_FOUND")
                    before = target["status"]
                    conn.execute(
                        "UPDATE users SET status = ?, updated_at = ? WHERE id = ?",
                        (target_status, utc_iso(), target_user_id),
                    )
                    conn.execute(
                        """
                        INSERT INTO audit_logs(operator_id, action, target_type, target_id, before_data, after_data, created_at)
                        VALUES (?, 'update_user_status', 'user', ?, ?, ?, ?)
                        """,
                        (
                            user["id"],
                            target_user_id,
                            json.dumps({"status": before, "note": note}, ensure_ascii=False),
                            json.dumps({"status": target_status}, ensure_ascii=False),
                            utc_iso(),
                        ),
                    )
                    conn.commit()
                    return self.send_json(200, {"ok": True, "user_id": target_user_id, "status": target_status})

                if parsed.path == "/api/admin/demo/init":
                    if not user or not user["is_admin"]:
                        return self.send_api_error(403, "admin only", "ADMIN_ONLY")
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        result = init_demo_data(conn)
                        conn.commit()
                        return self.send_json(
                            200,
                            {
                                "ok": True,
                                "result": result,
                                "accounts": {
                                    "admin": "admin_demo/admin123",
                                    "publisher": "publisher_demo/publisher123",
                                    "helper": "helper_demo/helper123",
                                },
                            },
                        )
                    except Exception:
                        conn.rollback()
                        return self.send_api_error(500, "init demo data failed", "INTERNAL_ERROR")

                return self.send_api_error(404, "not found", "NOT_FOUND")
            finally:
                conn.close()

    def do_HEAD(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()


def run_server():
    load_quality_rules()
    init_db()
    worker = threading.Thread(target=auto_settle_loop, daemon=True)
    worker.start()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Server running at http://{HOST}:{PORT}")
    print("Auto-settle worker enabled: 72-hour timeout, first-valid-answer rule.")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
