# Release Notes v0.9.2-beta

日期：2026-03-05

## 新增

1. 容器化部署支持
- 新增 `Dockerfile`
- 新增 `docker-compose.yml`
- 新增 `.dockerignore`

2. 反向代理示例
- 新增 `deploy/nginx/mutual-help.conf`

## 改进

1. 服务配置支持环境变量
- `DB_PATH`
- `STATIC_DIR`
- `QUALITY_RULES_PATH`

2. 版本号更新
- API 版本提升为 `0.9.2-beta`

3. 部署文档修复与完善
- 修复 `DEPLOY.md` 代码块格式问题
- 补充 Docker 与 Nginx 部署路径

## 验收

1. 本地启动 + API 冒烟通过：
- `smoke_test: OK`
2. 关键主链路（注册/发布任务/提交回答/选最佳/结算）可用
