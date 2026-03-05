# 内测部署说明

## 1. 服务器准备

1. Ubuntu 22.04+
2. Python 3.9+
3. 开放端口 `8000`（或通过 Nginx 反代）

## 2. 启动服务

```bash
cd /path/to/mutual-help-platform
chmod +x scripts/start_prod.sh
HOST=0.0.0.0 PORT=8000 ./scripts/start_prod.sh
```

或者使用一键内测启动（含预检查）：

```bash
HOST=0.0.0.0 PORT=8000 bash scripts/beta_start.sh
```

## 3. 健康检查

```bash
curl http://127.0.0.1:8000/api/health
python3 scripts/smoke_test.py http://127.0.0.1:8000
bash scripts/backup_db.sh

恢复流程（先停服务）：

```bash
sudo systemctl stop mutual-help
CONFIRM_RESTORE=YES bash scripts/restore_db.sh backups/app_YYYYMMDD_HHMMSS.db
sudo systemctl start mutual-help
```
```

## 4. 推荐的 systemd 配置

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
