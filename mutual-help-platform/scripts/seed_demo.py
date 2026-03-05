#!/usr/bin/env python3
import hashlib
import json
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("DB_PATH", str(ROOT / "app.db"))).resolve()


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def hash_password(password, salt=None):
    active_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        active_salt.encode("utf-8"),
        120000,
    ).hex()
    return f"{active_salt}${digest}"


def upsert_user(conn, username, password, is_admin=False, available_points=300):
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        return existing[0]
    conn.execute(
        """
        INSERT INTO users(
          username, password_hash, available_points, frozen_points, reputation_score,
          is_admin, status, created_at, updated_at
        ) VALUES (?, ?, ?, 0, 60, ?, 'active', ?, ?)
        """,
        (username, hash_password(password), available_points, 1 if is_admin else 0, now_iso(), now_iso()),
    )
    return conn.execute("SELECT last_insert_rowid()").fetchone()[0]


def create_demo_task(conn, publisher_id, title, desc, criteria, reward):
    conn.execute(
        """
        INSERT INTO tasks(
          publisher_id, title, description, acceptance_criteria, reward_points, deadline_at,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'open', ?, ?)
        """,
        (publisher_id, title, desc, criteria, reward, now_iso(), now_iso()),
    )
    task_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.execute(
        """
        INSERT INTO point_transactions(task_id, payer_id, payee_id, amount, status, created_at)
        VALUES (?, ?, NULL, ?, 'frozen', ?)
        """,
        (task_id, publisher_id, reward, now_iso()),
    )
    # freeze points
    user = conn.execute(
        "SELECT available_points, frozen_points FROM users WHERE id = ?",
        (publisher_id,),
    ).fetchone()
    conn.execute(
        "UPDATE users SET available_points = ?, frozen_points = ?, updated_at = ? WHERE id = ?",
        (user[0] - reward, user[1] + reward, now_iso(), publisher_id),
    )
    conn.execute(
        """
        INSERT INTO point_ledger(
          user_id, biz_type, delta_available, delta_frozen, available_after, frozen_after,
          ref_type, ref_id, remark, created_at
        ) VALUES (?, 'freeze_task_reward', ?, ?, ?, ?, 'task', ?, 'seed demo task', ?)
        """,
        (publisher_id, -reward, reward, user[0] - reward, user[1] + reward, task_id, now_iso()),
    )
    return task_id


def create_demo_answer(conn, task_id, author_id, content, score):
    conn.execute(
        """
        INSERT INTO answers(
          task_id, author_id, content, external_links, quality_meta, quality_score, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'valid', ?, ?)
        """,
        (
            task_id,
            author_id,
            content,
            json.dumps(["https://ocw.mit.edu"], ensure_ascii=False),
            json.dumps({"seed_demo": True, "final_score": score}, ensure_ascii=False),
            score,
            now_iso(),
            now_iso(),
        ),
    )


def main():
    if not DB_PATH.exists():
        raise SystemExit(f"database not found: {DB_PATH}. Please start server once to initialize database.")
    conn = sqlite3.connect(DB_PATH)
    try:
        admin_id = upsert_user(conn, "admin_demo", "admin123", is_admin=True, available_points=500)
        pub_id = upsert_user(conn, "publisher_demo", "publisher123", available_points=500)
        helper_id = upsert_user(conn, "helper_demo", "helper123", available_points=300)
        task_id = create_demo_task(
            conn,
            pub_id,
            "求 Python 学习资料合法路径",
            "需要公开课程与教材检索路径，避免盗版。",
            "至少提供3条可执行路径",
            30,
        )
        create_demo_answer(conn, task_id, helper_id, "建议先看公开课平台，再配合出版社目录与图书馆检索。", 72.5)
        create_demo_answer(conn, task_id, admin_id, "可以先梳理关键词，再去公开课程站做二次检索。", 56.0)
        conn.commit()
        print(
            "seed_demo: OK",
            json.dumps(
                {
                    "admin": "admin_demo/admin123",
                    "publisher": "publisher_demo/publisher123",
                    "helper": "helper_demo/helper123",
                    "task_id": task_id,
                },
                ensure_ascii=False,
            ),
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
