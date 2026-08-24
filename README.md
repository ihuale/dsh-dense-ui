# dsh-dense-ui

一个给 **DeepSeek Harness Web（`dsh web`）** 用的「信息密度」插件 bundle。它把聊天界面里几处偏松的排版/布局集中到一个设置面板里，支持**实时预览**和**持久化保存**。

- 可调项：正文字号、正文行高、标题缩放、段落间距、列表项间距、聊天内容区宽度、输入框宽度（固定像素 或 百分比+小屏自适应）。
- 改动**立即生效**，并写入 profile 的 `settings.yaml`，下次启动自动恢复。

## 源码即全部

这个包**没有构建步骤、没有编译产物**：`lib/` 下的 `.js` 就是运行时直接执行的源码。

- `lib/index.js` — Host 半：向 settings 服务注册持久化 schema（namespace `dense-ui`）。
- `lib/client.js` — 浏览器半：注入 CSS + 设置面板 UI + 实时预览 + 持久化。
- `cordis.patch.yml` — bundle 补丁：把插件挂载进 profile 的加载树。
- `package.json` — 包清单与 `dsh.bundle` / `dsh.client` 声明。

> 想改默认值或加字段，直接编辑 `lib/index.js` 里的 `DEFAULTS` 与 schema、`lib/client.js` 里的 `DEFAULTS` 和 `DenseUiPanel` 即可。许可为 MIT，可随意修改再分发。

## 安装

### 前置

- 已安装 `dsh`（`npm install -g @deepseek-ai/dsh`）。
- 系统里可用 `pnpm`（`dsh plugin` 只是把参数转发给 pnpm）。

### 1. 放进 profile

```sh
# 在包目录的上级执行；路径按你的实际情况改
dsh plugin --profile web add file:/绝对路径/dsh-dense-ui
```

`dsh plugin` 会执行 `pnpm add`，并在检测到本包声明了 `dsh.bundle` 后自动把它追加到 `dsh.profile.bundles`。

### 2. 重启 web

```sh
dsh web
```

打开设置页（左侧「设置」→ 导航里会出现 **Dense UI**），拖动滑块即可实时预览；值会自动保存。

## 卸载

```sh
dsh plugin --profile web remove dsh-dense-ui
dsh web   # 重启生效
```

## 关于二次定制 / 分发

- **发给另一台 Mac**：把整个目录拷过去（或打包 `tar`），在那边执行上面的 `dsh plugin --profile web add file:/…` 即可。因为源码都在 `lib/*.js`，对方改完直接生效。
- **上 GitHub 个人仓库**：整个目录 `git init` 提交即可；对方 `git clone` 后同样用 `file:` 安装，或者将来发布 npm 后 `dsh plugin --profile web add dsh-dense-ui`。
- **要不要带源码**：这个包本身就没有「隐藏源码」的形态——`lib/*.js` 就是全部实现，`files` 字段也确保它们随包分发。

## 默认值

| 字段 | 默认 | 范围 |
|---|---|---|
| `bodyFontSize` 正文字号 | 14 px | 10–24 |
| `bodyLineHeight` 正文行高 | 22 px | 12–40 |
| `headingScale` 标题缩放 | 0.84 | 0.5–1.5 |
| `paragraphSpacing` 段落间距 | 8 px | 0–40 |
| `listSpacing` 列表项间距 | 3 px | 0–20 |
| `chatContentWidth` 聊天内容区宽度 | 1120 px | 400–2000 |
| `composerWidth` 输入框宽度 | 992 px | 200–1600 |
| `composerMode` 输入框宽度模式 | `fixed` | `fixed` \| `percent` |
| `composerPercent` 输入框宽度百分比 | 72 | 30–100 |
