# 内测操作手册

## 1. 启动服务

方式 A（Python）：

```bash
cd /Users/zhangbin/Desktop/AIcode/mutual-help-platform
HOST=0.0.0.0 PORT=8000 DB_PATH=./app.db bash scripts/beta_start.sh
```

方式 B（Docker）：

```bash
cd /Users/zhangbin/Desktop/AIcode/mutual-help-platform
mkdir -p data
docker compose up -d --build
```

打开：`http://127.0.0.1:8000`

## 2. 快速准备演示数据（管理员）

1. 使用管理员账号登录。
2. 在“管理员处理举报”区域点击“初始化演示数据”。
3. 刷新任务广场可看到 demo 任务与回答。

## 3. 普通用户演示流程

1. 注册账号
2. 发布任务并冻结积分
3. 切换另一个账号提交回答
4. 发布者选择最佳答案完成结算

## 4. 管理员演示流程

1. 查看举报列表并处理
2. 查看用户列表并执行封禁/解封
3. 查看系统统计
4. 查看/重载评分规则

## 5. 常见问题

1. 报 `USER_BANNED`：账号被封禁，需管理员恢复。
2. 报 `RATE_LIMIT_*`：触发频率限制，等待后重试。
3. 报 `CONTENT_BLOCKED`：命中敏感词规则，修改内容后再提交。
