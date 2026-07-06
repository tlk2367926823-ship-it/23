# 直接打开小红书 App 发布入口

如果目标是“扫码或 NFC 后不进入活动网页，直接打开小红书 App 发布入口”，可以把二维码或 NFC 标签写成小红书 App Scheme。

注意：这种方式不会先进入本项目页面，因此不能自动调用通义千问生成文案，也不能把文案自动带入小红书。它只负责拉起小红书 App 发布入口。

## 安卓 NFC 推荐链接

安卓建议写入 Intent URL：

```text
intent://post/#Intent;scheme=xhsdiscover;package=com.xingin.xhs;S.browser_fallback_url=https%3A%2F%2Fwww.xiaohongshu.com;end
```

如果是视频发布入口，可以尝试：

```text
intent://post_video_album/#Intent;scheme=xhsdiscover;package=com.xingin.xhs;S.browser_fallback_url=https%3A%2F%2Fwww.xiaohongshu.com;end
```

## iPhone NFC 推荐链接

iPhone 可尝试写入：

```text
xhsdiscover://post/
```

视频发布入口可尝试：

```text
xhsdiscover://post_video_album/
```

## 二维码说明

二维码直接使用 App Scheme 时，不同扫码入口表现不同：

- 手机系统相机：可能可以识别并提示打开 App
- 微信扫一扫：通常会拦截非网页 Scheme
- 支付宝/其他扫码器：表现不稳定

如果二维码面向大众客户，更推荐二维码指向网页；如果 NFC 面向现场固定设备，更适合写入 App Scheme。

## 推荐落地方式

### 方案 A：最少操作，直接打开 App

适合只要求用户自己发小红书，不需要 AI 文案：

```text
NFC / 二维码 -> 小红书 App 发布入口
```

优点：

- 最短路径
- 不依赖网页
- 不需要浏览器权限

缺点：

- 没有 AI 文案生成
- 不能自动带入标题、正文和素材
- 小红书 Scheme 不是官方稳定开放接口，后续版本可能变化

### 方案 B：AI 文案 + 尽量少操作

适合需要使用本项目功能：

```text
NFC / 二维码 -> 活动网页 -> 生成文案 -> 系统分享 / 打开小红书 App
```

优点：

- 可以生成标题、正文、标签
- 可以匹配素材
- 可统计活动页访问

缺点：

- 必须经过网页
- 受浏览器和系统分享能力限制

## 重要边界

普通网页、二维码、NFC 本身都不能把文字直接写进小红书 App 的发布输入框。要做到真正自动带入内容，需要以下能力之一：

- 小红书官方开放平台发布接口
- 自有原生 App，并获得小红书支持的分享/发布能力
- 用户手动复制/系统分享

