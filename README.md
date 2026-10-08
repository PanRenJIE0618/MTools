# MTools

Windows 桌面开发者工具箱：内置常用小工具 + 外挂程序 / 脚本 / 网页一键启动。白底简约 UI，中文界面。

设计规格见 [docs/superpowers/specs/2026-10-08-mtools-desktop-toolbox-design.md](docs/superpowers/specs/2026-10-08-mtools-desktop-toolbox-design.md)。

## 环境要求

- **Node.js** 18 或更高
- **npm**（随 Node 安装）
- Windows（第一版打包目标；开发可在其他平台运行 Electron）

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

启动 Electron 窗口，支持热更新。

## 构建

先编译应用，再按平台打包：

```bash
npm run build
```

Windows 安装包：

```bash
npm run build:win
```

其他平台（非 v1 重点）：

```bash
npm run build:mac
npm run build:linux
```

## 质量检查

```bash
npm test          # 单元测试（Vitest）
npm run typecheck # TypeScript
npm run lint      # ESLint
```

## 功能概览

### 首页

- 左侧分类：全部 / 开发 / 编码 / 文本 / 外挂
- 右侧工具网格、搜索、添加外挂
- 外挂配置持久化到用户目录 `tools.json`，重启后保留

### 内置工具（8 个）

| 工具 | 说明 |
|------|------|
| JSON 格式化 | 格式化、压缩、复制结果 |
| Base64 | 编码与解码 |
| URL 编解码 | encode / decode |
| 时间戳 | 时间戳与本地日期互转 |
| Hash | MD5 / SHA-256 等 |
| UUID | 生成 v4 UUID |
| 文本对比 | 行级 diff |
| 正则测试 | 匹配列表与高亮预览 |

### 外挂工具

- 类型：本地程序、脚本、HTTP(S) 网页
- 卡片上编辑 / 删除；点击启动（失败时 toast 提示）

## 技术栈

Electron · electron-vite · React · TypeScript

## 许可证

见仓库授权说明（如有）。
