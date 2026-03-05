# 内测发布检查清单

## A. 发布前

1. 启动服务：`HOST=0.0.0.0 PORT=8000 ./scripts/start_prod.sh`
2. 或 Docker 启动：`docker compose up -d --build`
3. 健康检查：`curl http://127.0.0.1:8000/api/health`
4. 版本检查：`curl http://127.0.0.1:8000/api/version`
5. 冒烟测试：`python3 scripts/smoke_test.py http://127.0.0.1:8000`
6. 备份数据库：`bash scripts/backup_db.sh`
7. 检查管理员账号可登录并可访问：
- 举报处理
- 用户管理
- 评分规则查看/重载
- 系统统计

## B. 核心业务回归

1. 普通用户发布任务 -> 冻结积分成功
2. 多用户提交回答 -> 质量分生成正常
3. 发布者选择最佳 -> 结算成功、信誉分变化正确
4. 举报提单 -> 管理员处理 -> 状态与信誉变更正确
5. 封禁用户后：
- 登录被拒绝
- 发任务/回答被拒绝
6. 解封后业务恢复

## C. 运营应急

1. 出现异常先备份：`bash scripts/backup_db.sh`
2. 必要时停服恢复：
- `sudo systemctl stop mutual-help`
- `CONFIRM_RESTORE=YES bash scripts/restore_db.sh backups/<file>.db`
- `sudo systemctl start mutual-help`

## D. 内测反馈收集

1. 收集 3 类问题：
- 规则不清晰
- 页面交互不顺
- 积分/结算异常
2. 每天复盘一次并记录修复优先级
