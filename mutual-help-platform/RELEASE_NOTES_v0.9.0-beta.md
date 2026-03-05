# Release Notes - v0.9.0-beta

## 版本定位

- 可上线内测版（Beta）
- 适用于小范围真实用户验证

## 主要能力

1. 任务与积分主链路：发布、回答、选最佳、结算、自动结算。
2. 质量评分体系：自动评分、分项解释、规则可配置与热重载。
3. 管理后台能力：举报处理、用户封禁/解封、系统统计。
4. 安全基线：请求体限制、输入长度限制、轻量频率限制、统一错误码。
5. 运维工具：启动脚本、冒烟测试、备份/恢复、演示数据初始化。

## 核心接口新增

1. `GET /api/version`
2. `GET /api/admin/system/stats`
3. `GET /api/admin/quality-config`
4. `POST /api/admin/quality-config/reload`
5. `GET /api/admin/users`
6. `POST /api/admin/users/{id}/status`
7. `POST /api/admin/demo/init`

## 兼容说明

- 接口错误格式统一为：`ok=false + error + error_code + version`。
- 前端已适配错误码展示。
