# Campus Survivor

校园主题的割草类 H5 小游戏首版。

当前版本已经包含：

- 首页和结算页
- PC 键盘移动
- 移动端任意位置动态摇杆
- 自动攻击
- 多种校园主题武器
- 普通怪、精英怪、Boss
- 升级三选一
- 本地最佳成绩存档
- 隐藏调试面板
- 直接替换主角脸部素材的入口
- 简易 Web Audio 音效、震屏和短停顿反馈
- 新增近战武器“尺子横扫”和带预警的 Boss 招式

## Development

```bash
npm install
npm run dev
```

默认开发地址：

`http://127.0.0.1:4173/`

## Build

```bash
npm run build
```

## Deploy

这个项目已经配置为发布到 GitHub Pages：

`https://meatbin2026.github.io/wudaishiguo/`

推送到 `main` 分支后，GitHub Actions 会自动构建并部署。

## Controls

- PC: `WASD` / 方向键移动
- Mobile: 非 UI 区域按下即可生成临时摇杆
- Debug: 按 `` ` `` 打开调试面板，按 `P` 切换暂停

## Replace Face Art

默认主角脸部素材位于：

`/public/art/player-face.svg`

后续如果你要直接更换美术素材，保持文件路径不变，替换成新的头像图即可。

统一校园风素材现在位于：

- `/public/art/characters/`
- `/public/art/enemies/`
- `/public/art/weapons/`
- `/public/art/pickups/`
- `/public/art/maps/`
- `/public/art/ui/`
- `/public/art/effects/`

后续如果你要整体替换主角身体、普通怪、精英怪或 Boss，美术文件优先直接替换这里的同名素材。
