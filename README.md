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

这个项目是纯静态文件，可以部署到 Cloudflare Pages、Netlify Drop 或其他免费静态托管服务。

## 公网访问

本地地址 `127.0.0.1` 和局域网地址 `192.168.x.x` 只适合预览。手机和电脑不在同一个 Wi-Fi 时，需要部署到公网静态托管。

不用 GitHub 的免费方案：

1. Cloudflare Pages：直接上传整个 `pill` 文件夹，得到一个 `*.pages.dev` 网址。
2. Netlify Drop：直接拖拽整个 `pill` 文件夹，得到一个 `*.netlify.app` 网址。
3. Cloudflare Quick Tunnel：临时把本机预览服务暴露到公网，得到一个 `*.trycloudflare.com` 网址。

部署时不需要构建命令，发布目录就是项目根目录。
