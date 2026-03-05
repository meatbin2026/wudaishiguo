# 内测部署说明

## 1. 服务器准备

1. Ubuntu 22.04+
2. Python 3.9+（非容器方式）或 Docker 24+
3. 开放端口 `8000`（推荐通过 Nginx 反代后仅开放 `80/443`）

## 2. 方式 A：Python 直接部署

```bash
cd /path/to/mutual-help-platform
chmod +x scripts/start_prod.sh
HOST=0.0.0.0 PORT=8000 DB_PATH=/path/to/data/app.db ./scripts/start_prod.sh
```

一键内测启动（含预检查）：

```bash
HOST=0.0.0.0 PORT=8000 DB_PATH=/path/to/data/app.db bash scripts/beta_start.sh
```

## 3. 方式 B：Docker Compose（推荐）

```bash
cd /path/to/mutual-help-platform
mkdir -p data
docker compose up -d --build
```

默认映射：
1. 服务端口：`8000:8000`
2. 数据目录：`./data:/data`
3. 数据库文件：`/data/app.db`

停止：

```bash
docker compose down
```

## 4. 健康检查与冒烟

```bash
curl http://127.0.0.1:8000/api/health
python3 scripts/smoke_test.py http://127.0.0.1:8000
bash scripts/backup_db.sh
```

恢复流程（先停服务）：

```bash
sudo systemctl stop mutual-help
CONFIRM_RESTORE=YES bash scripts/restore_db.sh backups/app_YYYYMMDD_HHMMSS.db
sudo systemctl start mutual-help
```

## 5. 推荐的 systemd 配置

`/etc/systemd/system/mutual-help.service`

```ini
[Unit]
Description=Mutual Help MVP
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/mutual-help-platform
Environment=HOST=0.0.0.0
Environment=PORT=8000
Environment=DB_PATH=/path/to/data/app.db
ExecStart=/bin/bash /path/to/mutual-help-platform/scripts/start_prod.sh
Restart=always
RestartSec=2
User=www-data

[Install]
WantedBy=multi-user.target
```

启用：

```bash
sudo systemctl daemon-reload
sudo systemctl enable mutual-help
sudo systemctl start mutual-help
sudo systemctl status mutual-help
```

## 6. Nginx 反向代理样例

参考文件：`deploy/nginx/mutual-help.conf`

```bash
sudo cp deploy/nginx/mutual-help.conf /etc/nginx/sites-available/mutual-help
sudo ln -sf /etc/nginx/sites-available/mutual-help /etc/nginx/sites-enabled/mutual-help
sudo nginx -t && sudo systemctl reload nginx
```
