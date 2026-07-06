# 深圳汇职驾校小红书分享活动

一个手机端优先的 Mobile Web App，用于深圳汇职驾校线下扫码/NFC 分享活动。

用户进入页面后，可以一键生成小红书标题、正文、标签和本地素材预览，并通过手机系统分享能力跳转到小红书继续发布。

## 功能

- 活动首页，适配扫码和 NFC 进入场景
- 通义千问 API 生成小红书文案
- 本地 Mock 图片素材自动匹配
- 生成结果预览
- 手机端系统分享，尽量减少复制粘贴
- 电脑端备用发布流程：复制文案并打开小红书创作者发布页
- 可选 Chrome/Edge 发布助手扩展
- 保留原 Auto-Redbook-Skills 的图片卡片渲染脚本

## 技术栈

- Vite
- React
- TypeScript
- Lucide React
- 通义千问 DashScope API

## 快速开始

### 1. 安装依赖

推荐使用 pnpm：

```bash
pnpm install
```

也可以使用 npm：

```bash
npm install
```

### 2. 配置环境变量

复制环境变量示例：

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

编辑 `.env.local`：

```env
VITE_DASHSCOPE_API_KEY=你的通义千问APIKey
VITE_DASHSCOPE_MODEL=qwen-plus
```

注意：不要把 `.env.local` 上传到 GitHub。

### 3. 启动开发服务

```bash
pnpm dev
```

默认访问：

```text
http://localhost:5173/
```

如果端口被占用，Vite 会自动切换到下一个端口。

### 4. 构建生产版本

```bash
pnpm build
```

构建产物会输出到 `dist/`。

### 5. 本地预览生产版本

```bash
pnpm preview
```

## 客户试用建议

客户扫码/NFC 试用时，建议使用手机浏览器打开页面。

安卓客户试用时，建议使用手机自带浏览器或 Chrome，并使用 Vercel 部署后的 HTTPS 地址。不要使用微信内置浏览器或本地 `http://192.168.x.x` 地址测试系统分享，因为安卓通常会在非 HTTPS 页面禁用系统分享能力。

核心流程：

1. 进入活动页面
2. 点击「立即发布」
3. 查看 AI 生成的小红书文案和素材
4. 点击「打开发布界面」
5. 点击「手机一键分享到小红书」
6. 在系统分享面板中选择小红书
7. 用户确认内容并发布
8. 回到活动页面点击「我已发布，领取奖励」

## 重要限制

普通网页不能直接控制小红书网页或 App 的输入框，也不能自动点击最终发布按钮。这是浏览器和移动系统的安全限制。

当前 MVP 的正式推荐方案是：

- 手机端：使用系统分享能力，把文案和素材交给小红书
- 电脑端：复制文案并打开小红书创作者发布页
- 正式全自动发布：需要接入小红书官方开放平台，并增加后端代理

## 可选：小红书发布助手扩展

目录：

```text
xhs-publish-helper/
```

这是一个 Chrome/Edge 扩展，用于桌面端小红书创作者页面的辅助填入。它不是移动端方案。

安装方式：

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 开启开发者模式
3. 点击「加载已解压的扩展程序」
4. 选择 `xhs-publish-helper` 目录

## 项目结构

```text
Auto-Redbook-Skills/
├── src/                         # Mobile Web App 源码
│   ├── App.tsx                  # 主交互流程
│   ├── qwen.ts                  # 通义千问 API 调用
│   ├── publishers.ts            # 发布/分享适配器
│   ├── mockAssets.ts            # 本地 Mock 素材匹配
│   ├── types.ts                 # 类型定义
│   └── styles.css               # 页面样式
├── public/mock-assets/           # 前端本地 Mock 素材
├── xhs-publish-helper/           # 可选浏览器发布助手扩展
├── scripts/                      # 原小红书卡片渲染和发布脚本
├── assets/                       # 原卡片模板和主题样式
├── demos/                        # 原卡片渲染示例
├── HUIZHI_MOBILE_WEB_APP_REQUIREMENTS.md
├── package.json
├── pnpm-lock.yaml
├── .env.example
└── README.md
```

## 原卡片渲染脚本

项目保留了原 Auto-Redbook-Skills 的卡片渲染能力。

安装 Python 依赖：

```bash
pip install -r requirements.txt
playwright install chromium
```

渲染示例：

```bash
python scripts/render_xhs.py demos/content.md -t sketch -m auto-split
```

## 安全说明

- 不要上传 `.env.local`
- 不要上传真实 Cookie
- 不要把通义千问 API Key 写进源码
- 不建议用 Cookie 自动化发布真实笔记
- 正式商业使用前，请确认小红书平台规则和开放平台权限
