#!/usr/bin/env python3
import hashlib
import json
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
HOST = "127.0.0.1"
PORT = 8000
SESSION_HOURS = 24 * 7
AUTO_SETTLE_HOURS = 72
AUTO_SETTLE_INTERVAL_SECONDS = 60
DEFAULT_REGISTER_POINTS = 200
REPUTATION_MIN = 0
REPUTATION_MAX = 100

DB_LOCK = threading.Lock()


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

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        if not raw:
            return {}
        return json.loads(raw.decode("utf-8"))

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
                if parsed.path == "/api/health":
                    return self.send_json(200, {"ok": True, "time": utc_iso()})

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
                            return self.send_json(404, {"error": "task not found"})
                        answers = conn.execute(
                            """
                            SELECT a.*, u.username AS author_name
                            FROM answers a
                            JOIN users u ON u.id = a.author_id
                            WHERE a.task_id = ?
                            ORDER BY a.created_at ASC
                            """,
                            (task_id,),
                        ).fetchall()
                        return self.send_json(
                            200,
                            {
                                "task": dict(task),
                                "answers": [dict(row) for row in answers],
                                "viewer_id": user["id"] if user else None,
                            },
                        )

                if parsed.path == "/api/me":
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
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
                        return self.send_json(401, {"error": "unauthorized"})
                    rows = conn.execute(
                        "SELECT * FROM tasks WHERE publisher_id = ? ORDER BY created_at DESC",
                        (user["id"],),
                    ).fetchall()
                    return self.send_json(200, {"tasks": [dict(row) for row in rows]})

                if parsed.path == "/api/me/tasks/answered":
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
                    rows = conn.execute(
                        """
                        SELECT DISTINCT t.*
                        FROM tasks t
                        JOIN answers a ON a.task_id = t.id
                        WHERE a.author_id = ?
                        ORDER BY t.created_at DESC
                        """,
                        (user["id"],),
                    ).fetchall()
                    return self.send_json(200, {"tasks": [dict(row) for row in rows]})

                if parsed.path == "/api/me/points":
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
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
                        return self.send_json(401, {"error": "unauthorized"})
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
                        return self.send_json(403, {"error": "admin only"})
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

                return self.send_json(404, {"error": "not found"})
            finally:
                conn.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            return self.send_json(404, {"error": "not found"})

        with DB_LOCK:
            conn = get_conn()
            try:
                body = self.read_json()
                user = self.auth_user(conn)

                if parsed.path == "/api/register":
                    username = (body.get("username") or "").strip()
                    password = (body.get("password") or "").strip()
                    if len(username) < 3 or len(password) < 6:
                        return self.send_json(400, {"error": "username>=3, password>=6"})
                    exists = conn.execute(
                        "SELECT id FROM users WHERE username = ?",
                        (username,),
                    ).fetchone()
                    if exists:
                        return self.send_json(409, {"error": "username exists"})
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
                    username = (body.get("username") or "").strip()
                    password = (body.get("password") or "").strip()
                    row = conn.execute(
                        "SELECT * FROM users WHERE username = ?",
                        (username,),
                    ).fetchone()
                    if not row or not verify_password(password, row["password_hash"]):
                        return self.send_json(401, {"error": "invalid credentials"})
                    token = create_session(conn, row["id"])
                    conn.commit()
                    return self.send_json(200, {"token": token, "user_id": row["id"]})

                if parsed.path == "/api/tasks":
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
                    title = (body.get("title") or "").strip()
                    description = (body.get("description") or "").strip()
                    criteria = (body.get("acceptance_criteria") or "").strip()
                    reward_points = int(body.get("reward_points") or 0)
                    deadline_at = body.get("deadline_at") or None
                    if not title or not description or not criteria:
                        return self.send_json(400, {"error": "title/description/acceptance_criteria required"})
                    if reward_points < 10:
                        return self.send_json(400, {"error": "reward_points must be >= 10"})
                    allowed, reason = apply_content_rules(f"{title}\n{description}\n{criteria}")
                    if not allowed:
                        return self.send_json(400, {"error": reason})
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
                        return self.send_json(400, {"error": str(err)})
                    except Exception:
                        conn.rollback()
                        return self.send_json(500, {"error": "create task failed"})

                if parsed.path.startswith("/api/tasks/") and parsed.path.endswith("/answers"):
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 4:
                        return self.send_json(404, {"error": "not found"})
                    task_id = int(parts[2])
                    content = (body.get("content") or "").strip()
                    links = body.get("external_links") or []
                    if not content:
                        return self.send_json(400, {"error": "content required"})
                    links_json = json.dumps(links, ensure_ascii=False)
                    allowed, reason = apply_content_rules(content + links_json)
                    if not allowed:
                        return self.send_json(400, {"error": reason})
                    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
                    if not task or task["status"] != "open":
                        return self.send_json(400, {"error": "task not open"})
                    if task["publisher_id"] == user["id"]:
                        return self.send_json(400, {"error": "publisher cannot answer own task"})
                    now = utc_iso()
                    conn.execute(
                        """
                        INSERT INTO answers(task_id, author_id, content, external_links, status, created_at, updated_at)
                        VALUES (?, ?, ?, ?, 'valid', ?, ?)
                        """,
                        (task_id, user["id"], content, links_json, now, now),
                    )
                    answer_id = conn.execute("SELECT last_insert_rowid() AS id").fetchone()["id"]
                    conn.commit()
                    return self.send_json(201, {"answer_id": answer_id})

                if parsed.path.startswith("/api/tasks/") and parsed.path.endswith("/select-best"):
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 4:
                        return self.send_json(404, {"error": "not found"})
                    task_id = int(parts[2])
                    answer_id = int(body.get("answer_id") or 0)
                    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
                    if not task:
                        return self.send_json(404, {"error": "task not found"})
                    if task["publisher_id"] != user["id"]:
                        return self.send_json(403, {"error": "not task publisher"})
                    try:
                        conn.execute("BEGIN IMMEDIATE")
                        settle_task(conn, task_id, answer_id, auto=False, operator_id=user["id"])
                        conn.commit()
                        return self.send_json(200, {"ok": True})
                    except ValueError as err:
                        conn.rollback()
                        return self.send_json(400, {"error": str(err)})
                    except Exception:
                        conn.rollback()
                        return self.send_json(500, {"error": "settle failed"})

                if parsed.path == "/api/reports":
                    if not user:
                        return self.send_json(401, {"error": "unauthorized"})
                    target_type = (body.get("target_type") or "").strip()
                    target_id = int(body.get("target_id") or 0)
                    reason = (body.get("reason") or "").strip()
                    evidence = (body.get("evidence") or "").strip()
                    if target_type not in {"task", "answer", "user"}:
                        return self.send_json(400, {"error": "invalid target_type"})
                    if target_id <= 0 or not reason:
                        return self.send_json(400, {"error": "target_id/reason required"})
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
                        return self.send_json(403, {"error": "admin only"})
                    parts = parsed.path.strip("/").split("/")
                    if len(parts) != 5:
                        return self.send_json(404, {"error": "not found"})
                    try:
                        report_id = int(parts[3])
                    except ValueError:
                        return self.send_json(400, {"error": "invalid report id"})
                    decision = (body.get("decision") or "").strip()
                    note = (body.get("note") or "").strip()
                    if decision not in {"approved", "rejected"}:
                        return self.send_json(400, {"error": "decision must be approved/rejected"})
                    report = conn.execute(
                        "SELECT * FROM reports WHERE id = ?",
                        (report_id,),
                    ).fetchone()
                    if not report:
                        return self.send_json(404, {"error": "report not found"})
                    if report["status"] != "pending":
                        return self.send_json(400, {"error": "report already resolved"})
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
                        return self.send_json(500, {"error": f"resolve report failed: {err}"})

                return self.send_json(404, {"error": "not found"})
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
    init_db()
    worker = threading.Thread(target=auto_settle_loop, daemon=True)
    worker.start()
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Server running at http://{HOST}:{PORT}")
    print("Auto-settle worker enabled: 72-hour timeout, first-valid-answer rule.")
    server.serve_forever()


if __name__ == "__main__":
    run_server()
