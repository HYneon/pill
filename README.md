# pill

一个极简的每日用药记录 PWA。

## 使用

用 iPhone Safari 打开网站后，选择“分享”里的“添加到主屏幕”。

## 规则

- 中间的 pill 按钮用于记录当前时间段的用药。
- 默认时间段：早药 07:00-10:00，晚药 19:00-22:00。
- 当天两次都按时记录，算作 1 个有效日。
- 每满 5 个有效日，获得 1 次开盲盒机会。
- 底部时间轴可以横向滑动；外圈代表早药，内点代表晚药。

## 修改时间

编辑 `app.js` 顶部的 `CONFIG.doseWindows`。

## 添加盲盒图片

把图片放进 `assets/boxes/`，再编辑 `boxes.json`：

```json
[
  {
    "src": "assets/boxes/example.jpg",
    "title": "图片标题"
  }
]
```

## 免费部署

这个项目是纯静态文件，可以部署到 GitHub Pages。

## 公网访问

本地地址 `127.0.0.1` 和局域网地址 `192.168.x.x` 只适合预览。手机和电脑不在同一个 Wi-Fi 时，需要部署到公网静态托管。

GitHub Pages 发布方式：

1. 把项目推送到 GitHub 仓库。
2. 进入仓库 Settings。
3. 进入 Pages。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/root`。

发布后，公网地址通常是：

```text
https://hyneon.github.io/pill/
```
