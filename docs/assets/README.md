# 戏命师美术资源上传目录

上传真实资源时保留当前目录结构。源文件建议另存 Figma/PSD，项目内优先放 WebP/PNG/SVG。

## 目录

- `public/assets/masters/trainee`：见习命师固定角色。
- `public/assets/masters/renji`：T3 人玑蓝色稀有戏命师。
- `public/assets/masters/dixuan`：T2 地璇紫色史诗戏命师。
- `public/assets/masters/tianshu`：T1 天枢金色传说戏命师。
- `public/assets/masters/chaos`：隐藏混沌黑金神话戏命师。
- `public/assets/blind-box/box`：盲盒外观。
- `public/assets/blind-box/opening`：开盒过程帧、动效素材。
- `public/assets/blind-box/results`：抽中结果背景、光效、票据。
- `public/assets/runes/silver`：银色铭文。
- `public/assets/runes/gold`：金色铭文。
- `public/assets/runes/chaos`：黑色混沌铭文。
- `public/assets/ui`：按钮、徽章、空状态、命盘光效等通用 UI。
- `public/assets/share`：分享卡背景、二维码装饰、朋友圈图。
- `public/assets/marketing`：投放海报、社群裂变图、落地页首屏图。
- `public/assets/avatars`：用户默认头像、机器人头像、运营账号头像。

## 快速导入

单张图片导入：

```bash
npm run art:import -- "/Users/yudeyou/Downloads/ChatGPT Image xxx.png" "public/assets/masters/trainee/trainee-01-card.webp"
```

脚本会同时保留 `.png` 源图，并生成项目使用的 `.webp` 文件。

批量处理时，可以先把 ChatGPT Images 下载的图片临时放到 `public/assets/_inbox`，然后逐张执行上面的命令，把它们导入到最终目录。
