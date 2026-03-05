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
- 回答质量分自动计算（长度、链接有效性、重复度）

## 运行方式

### 方式 A：本机 Python

```bash
cd /Users/zhangbin/Desktop/AIcode/mutual-help-platform
python3 server.py
```

启动后访问：`http://127.0.0.1:8000`

### 方式 B：Docker Compose（推荐）

```bash
cd /Users/zhangbin/Desktop/AIcode/mutual-help-platform
mkdir -p data
docker compose up -d --build
```

停止：

```bash
docker compose down
```

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
14. `GET /api/admin/quality-config`
15. `POST /api/admin/quality-config/reload`
16. `GET /api/admin/users`
17. `POST /api/admin/users/{id}/status`
18. `GET /api/admin/system/stats`
19. `GET /api/version`
20. `POST /api/admin/demo/init`
21. `GET /api/admin/audit-logs`

## 查询参数

- `GET /api/tasks`
1. `status`: `open|closed|auto_settled|cancelled|all`
2. `q`: 标题/描述关键词
3. `min_reward` / `max_reward`
4. `sort`: `created_desc|created_asc|reward_desc|reward_asc`
5. `page` / `page_size`（默认 1/10，最大 50）
6. 任务详情回答分页：`answer_page` / `answer_page_size` / `answer_sort`（`created_asc|created_desc|quality_desc|quality_asc`）

- `GET /api/admin/reports`
1. `status`: `pending|approved|rejected|all`
2. `target_type`: `task|answer|user|all`
3. `page` / `page_size`（默认 1/10，最大 50）

- `GET /api/me/tasks/published` 和 `GET /api/me/tasks/answered`
1. `status`: `open|closed|auto_settled|cancelled|all`
2. `page` / `page_size`（默认 1/10，最大 50）

## 管理员规则

- 首个注册用户自动成为管理员（`is_admin=1`）。
- 可在前端“管理员处理举报”面板完成举报审批。

## 回答质量分（0-100）

系统在提交回答时自动打分并写入 `quality_score`，用于详情页排序：
1. 内容长度越充分，分数越高。
2. 合法 `http/https` 外链可加分，非法链接会扣分。
3. 与同任务已有答案重复度越高，扣分越多。
4. `POST /api/tasks/{id}/answers` 会返回 `quality_meta`，包含各分项加减分与最终分。

评分权重来源于：
- [/Users/zhangbin/Desktop/AIcode/mutual-help-platform/quality_rules.json](/Users/zhangbin/Desktop/AIcode/mutual-help-platform/quality_rules.json)
- 修改该文件后可调用 `POST /api/admin/quality-config/reload` 无重启生效

## 安全与限流（内测版）

1. 请求体大小上限：`100KB`
2. 字段长度限制：标题/描述/验收/回答/举报内容均有限制
3. 回答外链数量上限：`8`
4. 轻量频率限制（按用户/IP）：注册、登录、发任务、提交回答、举报
5. 统一错误结构：`error` + `error_code`

## 数据文件与环境变量

1. SQLite 数据库：默认 `app.db`（可用 `DB_PATH` 自定义）
2. 可选环境变量：
- `HOST`（默认 `127.0.0.1`）
- `PORT`（默认 `8000`）
- `DB_PATH`（示例：`/data/app.db`）
- `QUALITY_RULES_PATH`（默认 `quality_rules.json`）

## 部署与自检

1. 启动脚本：`scripts/start_prod.sh`
1.5 一键内测启动（含预检查）：`HOST=0.0.0.0 PORT=8000 bash scripts/beta_start.sh`
1.6 一键内测启动 + 冒烟：`RUN_SMOKE=1 HOST=0.0.0.0 PORT=8000 bash scripts/beta_start.sh`
2. Docker 启动：`docker compose up -d --build`
3. 冒烟测试：`python3 scripts/smoke_test.py http://127.0.0.1:8000`
4. 备份数据库：`bash scripts/backup_db.sh`
5. 恢复数据库（先停服务）：`CONFIRM_RESTORE=YES bash scripts/restore_db.sh backups/app_YYYYMMDD_HHMMSS.db`
6. 演示数据初始化：`python3 scripts/seed_demo.py`
7. 内测部署文档：[/Users/zhangbin/Desktop/AIcode/mutual-help-platform/DEPLOY.md](/Users/zhangbin/Desktop/AIcode/mutual-help-platform/DEPLOY.md)
8. 发布检查清单：[/Users/zhangbin/Desktop/AIcode/mutual-help-platform/INTERNAL_BETA_CHECKLIST.md](/Users/zhangbin/Desktop/AIcode/mutual-help-platform/INTERNAL_BETA_CHECKLIST.md)
9. 版本发布说明：[/Users/zhangbin/Desktop/AIcode/mutual-help-platform/RELEASE_NOTES_v0.9.2-beta.md](/Users/zhangbin/Desktop/AIcode/mutual-help-platform/RELEASE_NOTES_v0.9.2-beta.md)
10. 内测操作手册：[/Users/zhangbin/Desktop/AIcode/mutual-help-platform/BETA_OPERATOR_GUIDE.md](/Users/zhangbin/Desktop/AIcode/mutual-help-platform/BETA_OPERATOR_GUIDE.md)
