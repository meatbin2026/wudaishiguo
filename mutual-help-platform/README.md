# 学习资料互助平台 MVP

一个可本地运行的最小实现，覆盖主链路：
- 用户注册/登录
- 发布任务并冻结积分
- 多人提交答案
- 发布者选择最佳答案并结算积分
- 72 小时自动结算（最早合规答案）
- 积分流水与举报接口
- 管理员举报处理（approved/rejected）
- 信誉分规则（最佳答案 +5，被举报成立 -10，举报成功 +2）

## 运行方式

```bash
cd /Users/zhangbin/Desktop/AIcode/mutual-help-platform
python3 server.py
```

启动后访问：`http://127.0.0.1:8000`

## 默认规则

1. 注册赠送 `200` 积分。
2. 发布任务最小悬赏 `10` 积分。
3. 平台禁止盗版类敏感词（基础规则，可继续扩展）。
4. 自动结算每分钟扫描一次，结算创建超过 `72` 小时且仍为 open 的任务。

## 主要 API

1. `POST /api/register`
2. `POST /api/login`
3. `GET /api/me`
4. `GET /api/tasks`
5. `POST /api/tasks`
6. `GET /api/tasks/{id}`
7. `POST /api/tasks/{id}/answers`
8. `POST /api/tasks/{id}/select-best`
9. `GET /api/me/points`
10. `GET /api/me/points/ledger`
11. `POST /api/reports`
12. `GET /api/admin/reports?status=pending`
13. `POST /api/admin/reports/{id}/resolve`

## 管理员规则

- 首个注册用户自动成为管理员（`is_admin=1`）。
- 可在前端“管理员处理举报”面板完成举报审批。

## 数据文件

- SQLite 数据库：`app.db`（首次启动自动创建）
