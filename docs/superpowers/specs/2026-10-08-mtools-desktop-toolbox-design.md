# MTools 桌面工具箱 — 设计规格

日期：2026-10-08  
状态：待用户确认后进入实现计划

## 1. 目标

构建 Windows 桌面应用 **MTools**：白底简约的开发者工具箱。支持：

- **内置工具**：应用内页面（JSON、编解码、时间戳等）
- **外挂工具**：本地程序 / 脚本 / 网页链接，一键启动
- 统一目录浏览：分类、搜索、增删外挂

## 2. 约束与非目标

### 约束

- 技术栈：Electron + electron-vite + React + TypeScript
- 平台：Windows 优先
- UI 语言：中文
- 视觉：白色系底、浅灰分隔、近黑文字、少阴影、细边框

### 第一版不做

- 动态插件热加载
- 账号 / 云同步
- 自动更新
- 暗色主题
- macOS / Linux 打包

## 3. 架构

采用 **统一工具注册表**：内置与外挂共享同一套 `Tool` 元数据，首页网格统一展示。

```text
┌─────────────┐     IPC      ┌──────────────────┐
│  Renderer   │ ◄──────────► │  Main Process    │
│  React UI   │   preload    │  tools.json I/O  │
│  builtin    │              │  launch external │
└─────────────┘              └──────────────────┘
```

### 进程职责

| 进程 | 职责 |
|------|------|
| Renderer | UI、路由、内置工具业务逻辑 |
| Main | 读写 `userData/tools.json`；启动外挂（`shell.openPath` / `spawn` / `shell.openExternal`） |
| Preload | 暴露受控 API，禁止随意 Node 访问 |

### 建议目录

```text
electron/          # 主进程、preload、IPC
src/
  components/      # 布局、卡片、弹层、toast
  tools/           # 各内置工具页（独立目录）
  registry/        # 内置工具注册表 + 与外挂合并
  styles/          # 白底主题变量
```

## 4. 界面信息架构

布局：**左侧分类 + 右侧工具网格**（方案 A）。

- **左侧**：品牌 `MTools`；分类：全部 / 开发 / 编码 / 文本 / 外挂
- **右侧顶栏**：搜索框；「添加工具」按钮
- **右侧主体**：工具卡片网格
- **内置工具**：点击进入全页工作区（顶栏：返回 + 名称 + 简短说明）
- **外挂工具**：点击直接启动；卡片支持编辑 / 删除
- **添加工具弹层**：名称、分类、类型（程序 / 脚本 / 网页）、路径或 URL、可选图标、可选启动参数

### 视觉约定

- 背景：`#FFFFFF` / `#FAFAFA`
- 主操作：近黑填充按钮
- 次要操作：浅边框按钮
- 反馈：轻量 toast（复制成功、启动失败等），避免系统对话框

## 5. 数据模型

```ts
type ToolKind = 'builtin' | 'app' | 'script' | 'url';
type ToolCategory = 'dev' | 'encode' | 'text' | 'external';

interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  kind: ToolKind;
  route?: string;      // builtin only
  target?: string;     // path or URL for external
  args?: string;       // optional launch args
  icon?: string;
  builtin: boolean;    // true = 预置，不可删除
}
```

### 存储

- 内置工具：代码内静态注册表
- 用户外挂：`app.getPath('userData')/tools.json`
- 启动时合并：内置 + 用户外挂 → 供筛选与搜索

### `tools.json` 损坏

回退为空外挂列表，toast 提示，不阻断内置工具。

## 6. 内置工具（第一版）

| 工具 | 分类 | 行为 |
|------|------|------|
| JSON 格式化 | 开发 | 格式化 / 压缩 / 复制；非法 JSON 行内报错 |
| Base64 | 编码 | 编码 / 解码；复制 |
| URL 编解码 | 编码 | encode / decode；复制 |
| 时间戳 | 开发 | 秒/毫秒互转；本地时间；「现在」 |
| Hash | 编码 | MD5 / SHA1 / SHA256；复制 |
| UUID | 开发 | 生成 v4；数量 1–20；批量复制 |
| 文本对比 | 文本 | 双栏文本；行级差异高亮 |
| 正则测试 | 文本 | 表达式 + g/i/m；匹配列表与高亮 |

### 外挂行为

- `app`：主进程对 `target` 使用 `shell.openPath`；若提供 `args` 则改用 `spawn(target, args)`（不经 shell）
- `script`：Windows 下对 `.bat` / `.cmd` / `.ps1` / `.js` 等使用 `shell.openPath(target)`，交由系统默认关联打开
- `url`：`shell.openExternal(target)`，仅允许 `http:` / `https:`
- 失败：toast + 保留卡片，便于修改路径

## 7. 错误处理

- 内置工具输入错误：页面内文案，应用不崩溃
- 外挂启动失败：toast
- 配置文件损坏：安全回退

## 8. 验收标准

1. 启动后呈现左侧分类 + 右侧网格，白底简约可读
2. 8 个内置工具均可打开并完成主流程
3. 可新增 / 编辑 / 删除外挂（exe / 脚本 / URL）并成功启动
4. 搜索与分类筛选可用
5. 重启后外挂配置仍在

## 9. 决策记录

| 决策 | 选择 |
|------|------|
| 产品形态 | 内置工具 + 外挂启动器 |
| 技术栈 | Electron + electron-vite + React + TypeScript |
| 内置范围 | 方案 B（8 工具） |
| 实现路线 | 统一工具注册表（方案 1） |
| 主布局 | 左侧分类 + 工具网格（布局 A） |
