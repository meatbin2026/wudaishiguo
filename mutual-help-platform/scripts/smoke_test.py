#!/usr/bin/env python3
import json
import sys
import time
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def call(path, method="GET", data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = None if data is None else json.dumps(data).encode()
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as err:
        payload = err.read().decode()
        raise RuntimeError(f"{method} {path} failed {err.code}: {payload}") from err


def main():
    suffix = str(int(time.time()))[-6:]
    _, owner = call("/api/register", "POST", {"username": f"ownsmk{suffix}", "password": "owner123"})
    _, helper = call("/api/register", "POST", {"username": f"helpsmk{suffix}", "password": "helper12"})
    _, task = call(
        "/api/tasks",
        "POST",
        {
            "title": "smoke task",
            "description": "合法线索",
            "acceptance_criteria": "3条路径",
            "reward_points": 20,
        },
        owner["token"],
    )
    _, answer = call(
        f"/api/tasks/{task['task_id']}/answers",
        "POST",
        {"content": "公开课程站点 + 出版社目录 + 图书馆检索", "external_links": ["https://ocw.mit.edu"]},
        helper["token"],
    )
    _, settled = call(
        f"/api/tasks/{task['task_id']}/select-best",
        "POST",
        {"answer_id": answer["answer_id"]},
        owner["token"],
    )
    _, detail = call(f"/api/tasks/{task['task_id']}", token=owner["token"])
    if detail["task"]["status"] not in {"closed", "auto_settled"}:
        raise RuntimeError("task did not settle")
    print("smoke_test: OK", json.dumps({"task_id": task["task_id"], "settled": settled}, ensure_ascii=False))


if __name__ == "__main__":
    main()
