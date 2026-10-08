# MTools Desktop Toolbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Windows Electron desktop toolbox (MTools) with 8 built-in tools, external launcher CRUD, sidebar categories, search, and white minimal UI.

**Architecture:** electron-vite dual-process app. Built-in tools are React routes registered in a static registry; user externals persist in `userData/tools.json` via main-process IPC. Renderer never touches Node APIs directly — only `window.mtools` from preload.

**Tech Stack:** Electron, electron-vite, React 18, TypeScript, React Router, crypto-js (or Web Crypto), vitest for pure-logic unit tests.

## Global Constraints

- Platform: Windows first; UI language Chinese
- Visual: white base `#FFFFFF` / `#FAFAFA`, light gray borders, near-black text, minimal shadow
- External URL launch: only `http:` / `https:`
- Built-in tools are not deletable; user externals are editable/deletable
- No plugin hot-load, cloud sync, auto-update, or dark theme in v1
- Spec: `docs/superpowers/specs/2026-10-08-mtools-desktop-toolbox-design.md`

---

## File Structure

```text
package.json
electron.vite.config.ts
tsconfig.json
tsconfig.node.json
tsconfig.web.json
vitest.config.ts
.gitignore
index.html
src/
  main/
    index.ts                 # BrowserWindow, IPC registration
    toolsStore.ts            # read/write tools.json
    launchTool.ts            # openPath / spawn / openExternal
  preload/
    index.ts                 # contextBridge → window.mtools
    index.d.ts               # Window typings
  renderer/
    index.html               # (or root index.html per electron-vite)
    src/
      main.tsx
      App.tsx
      styles/theme.css
      types/tool.ts
      registry/builtinTools.ts
      registry/mergeTools.ts
      hooks/useTools.ts
      components/
        AppShell.tsx
        Sidebar.tsx
        ToolGrid.tsx
        ToolCard.tsx
        SearchBar.tsx
        AddToolModal.tsx
        Toast.tsx
        ToolPageHeader.tsx
      pages/
        HomePage.tsx
        ToolHostPage.tsx
      tools/
        json/JsonTool.tsx
        base64/Base64Tool.tsx
        url/UrlTool.tsx
        timestamp/TimestampTool.tsx
        hash/HashTool.tsx
        uuid/UuidTool.tsx
        diff/DiffTool.tsx
        regex/RegexTool.tsx
      lib/
        toastBus.ts
        categoryLabels.ts
tests/
  mergeTools.test.ts
  launchUrlGuard.test.ts
  hashTool.test.ts
  diffLines.test.ts
```

---

### Task 1: Scaffold electron-vite + React + TS

**Files:**
- Create: project root via electron-vite template (`package.json`, `electron.vite.config.ts`, `src/main`, `src/preload`, `src/renderer`, configs)
- Create: `.gitignore` (include `node_modules`, `dist`, `out`, `.superpowers/`)
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: runnable `npm run dev` Electron window; path aliases `@renderer/*` if template provides them

- [ ] **Step 1: Scaffold the app in `e:\Pan\MTools`**

If the directory is not empty (docs already exist), scaffold into a temp folder then move app files into root, OR manually create the electron-vite file layout. Prefer:

```bash
npm create @quick-start/electron@latest . -- --template react-ts
```

If the create command refuses non-empty dir, create in `_scaffold` and move `package.json`, configs, and `src/` into root without overwriting `docs/`.

- [ ] **Step 2: Install deps and add test tooling**

```bash
npm install
npm install -D vitest @types/node
npm install react-router-dom crypto-js
npm install -D @types/crypto-js
```

- [ ] **Step 3: Add scripts and vitest config**

In `package.json` scripts ensure:

```json
{
  "dev": "electron-vite dev",
  "build": "electron-vite build",
  "test": "vitest run"
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: { environment: 'node' },
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer/src')
    }
  }
})
```

- [ ] **Step 4: Verify app boots**

Run: `npm run dev`  
Expected: Electron window opens without crash (blank/template UI OK).

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: scaffold electron-vite React TypeScript app"
```

---

### Task 2: Tool types, builtin registry, merge logic

**Files:**
- Create: `src/renderer/src/types/tool.ts`
- Create: `src/renderer/src/registry/builtinTools.ts`
- Create: `src/renderer/src/registry/mergeTools.ts`
- Create: `src/renderer/src/lib/categoryLabels.ts`
- Test: `tests/mergeTools.test.ts`

**Interfaces:**
- Produces:
  - `ToolKind = 'builtin' | 'app' | 'script' | 'url'`
  - `ToolCategory = 'dev' | 'encode' | 'text' | 'external'`
  - `interface Tool { id, name, description, category, kind, route?, target?, args?, icon?, builtin }`
  - `builtinTools: Tool[]`
  - `mergeTools(builtin: Tool[], external: Tool[]): Tool[]` — externals after builtins; drop external ids that collide with builtin ids
  - `CATEGORY_LABELS: Record<ToolCategory | 'all', string>`

- [ ] **Step 1: Write failing merge test**

```ts
// tests/mergeTools.test.ts
import { describe, it, expect } from 'vitest'
import { mergeTools } from '../src/renderer/src/registry/mergeTools'
import type { Tool } from '../src/renderer/src/types/tool'

const builtin: Tool[] = [{
  id: 'json', name: 'JSON', description: '', category: 'dev',
  kind: 'builtin', route: '/tools/json', builtin: true
}]

describe('mergeTools', () => {
  it('appends externals and drops id collisions', () => {
    const external: Tool[] = [
      { id: 'json', name: 'hijack', description: '', category: 'external', kind: 'app', target: 'C:\\a.exe', builtin: false },
      { id: 'my-app', name: 'My', description: '', category: 'external', kind: 'app', target: 'C:\\b.exe', builtin: false }
    ]
    const merged = mergeTools(builtin, external)
    expect(merged.map(t => t.id)).toEqual(['json', 'my-app'])
    expect(merged[0].name).toBe('JSON')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `npm test -- tests/mergeTools.test.ts`  
Expected: FAIL module not found / mergeTools undefined

- [ ] **Step 3: Implement types + merge + builtin list**

`src/renderer/src/types/tool.ts` — exact fields from Interfaces.

`src/renderer/src/registry/mergeTools.ts`:

```ts
import type { Tool } from '../types/tool'

export function mergeTools(builtin: Tool[], external: Tool[]): Tool[] {
  const builtinIds = new Set(builtin.map(t => t.id))
  const safeExternal = external.filter(t => !builtinIds.has(t.id) && !t.builtin)
  return [...builtin, ...safeExternal]
}
```

`builtinTools.ts` — register all 8 tools with Chinese names/descriptions and routes:

| id | name | category | route |
|----|------|----------|-------|
| json | JSON 格式化 | dev | /tools/json |
| base64 | Base64 | encode | /tools/base64 |
| url | URL 编解码 | encode | /tools/url |
| timestamp | 时间戳 | dev | /tools/timestamp |
| hash | Hash | encode | /tools/hash |
| uuid | UUID | dev | /tools/uuid |
| diff | 文本对比 | text | /tools/diff |
| regex | 正则测试 | text | /tools/regex |

`categoryLabels.ts`:

```ts
export const CATEGORY_LABELS = {
  all: '全部',
  dev: '开发',
  encode: '编码',
  text: '文本',
  external: '外挂'
} as const
```

- [ ] **Step 4: Run test — expect PASS**

Run: `npm test -- tests/mergeTools.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/types src/renderer/src/registry src/renderer/src/lib/categoryLabels.ts tests/mergeTools.test.ts
git commit -m "feat: add tool types, builtin registry, and merge logic"
```

---

### Task 3: Main process tools store + launch

**Files:**
- Create: `src/main/toolsStore.ts`
- Create: `src/main/launchTool.ts`
- Create: `tests/launchUrlGuard.test.ts`
- Modify: `src/main/index.ts` — register IPC handlers

**Interfaces:**
- Produces (main):
  - `loadExternalTools(): Promise<Tool[]>`
  - `saveExternalTools(tools: Tool[]): Promise<void>`
  - `assertSafeUrl(url: string): string` — throws if not http(s)
  - `launchExternal(tool: Pick<Tool,'kind'|'target'|'args'>): Promise<{ ok: true } | { ok: false; error: string }>`
- IPC channels:
  - `tools:list` → `Tool[]` (externals only)
  - `tools:save` → `(tools: Tool[]) => void` (replace all externals)
  - `tools:launch` → `(payload) => { ok, error? }`

- [ ] **Step 1: Write URL guard test**

```ts
// tests/launchUrlGuard.test.ts
import { describe, it, expect } from 'vitest'
import { assertSafeUrl } from '../src/main/launchTool'

describe('assertSafeUrl', () => {
  it('allows https', () => {
    expect(assertSafeUrl('https://example.com')).toBe('https://example.com/')
  })
  it('rejects file protocol', () => {
    expect(() => assertSafeUrl('file:///C:/x')).toThrow()
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm test -- tests/launchUrlGuard.test.ts`  
Expected: FAIL

- [ ] **Step 3: Implement store + launch**

`toolsStore.ts` path: `join(app.getPath('userData'), 'tools.json')`. On missing/invalid JSON return `[]` (do not throw).

`launchTool.ts`:

```ts
import { shell } from 'electron'
import { spawn } from 'node:child_process'
import { access } from 'node:fs/promises'
import { constants } from 'node:fs'

export function assertSafeUrl(raw: string): string {
  const u = new URL(raw)
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('仅支持 http/https 链接')
  }
  return u.toString()
}

export async function launchExternal(tool: {
  kind: 'app' | 'script' | 'url'
  target?: string
  args?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!tool.target) return { ok: false, error: '缺少目标路径或 URL' }
    if (tool.kind === 'url') {
      await shell.openExternal(assertSafeUrl(tool.target))
      return { ok: true }
    }
    await access(tool.target, constants.F_OK)
    if (tool.kind === 'app' && tool.args?.trim()) {
      const argv = tool.args.trim().split(/\s+/)
      spawn(tool.target, argv, { detached: true, stdio: 'ignore' }).unref()
      return { ok: true }
    }
    const err = await shell.openPath(tool.target)
    if (err) return { ok: false, error: err }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
```

Wire IPC in `src/main/index.ts` with `ipcMain.handle` for the three channels. Keep `Tool` type duplicated lightly in main or shared via a small `src/shared/tool.ts` — prefer **Create `src/shared/tool.ts`** and import from main + renderer to avoid drift.

If moving types to shared, update Task 2 imports accordingly in this task.

- [ ] **Step 4: Run URL tests — expect PASS**

Run: `npm test -- tests/launchUrlGuard.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/main src/shared tests/launchUrlGuard.test.ts
git commit -m "feat: persist external tools and launch via main process"
```

---

### Task 4: Preload bridge + renderer hook

**Files:**
- Modify: `src/preload/index.ts`
- Create/Modify: `src/preload/index.d.ts`
- Create: `src/renderer/src/hooks/useTools.ts`
- Create: `src/renderer/src/lib/toastBus.ts`

**Interfaces:**
- Produces:
  - `window.mtools.listExternal(): Promise<Tool[]>`
  - `window.mtools.saveExternal(tools: Tool[]): Promise<void>`
  - `window.mtools.launch(tool: Pick<Tool,'kind'|'target'|'args'>): Promise<{ok:boolean; error?: string}>`
  - `useTools()` → `{ tools, loading, reload, saveExternals, launch, error }`
  - `toastBus.show(message: string): void` / `subscribe(listener)`

- [ ] **Step 1: Implement preload**

```ts
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mtools', {
  listExternal: () => ipcRenderer.invoke('tools:list'),
  saveExternal: (tools: unknown) => ipcRenderer.invoke('tools:save', tools),
  launch: (tool: unknown) => ipcRenderer.invoke('tools:launch', tool)
})
```

Add `Window` interface with `mtools` in `index.d.ts`. Ensure `sandbox`/contextIsolation remain on in `BrowserWindow` webPreferences.

- [ ] **Step 2: Implement `useTools` + toast bus**

`useTools` loads externals on mount, merges with `builtinTools` via `mergeTools`, exposes `saveExternals` that filters `builtin === false` and calls IPC then reloads.

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`  
In DevTools console: `await window.mtools.listExternal()` → `[]`  
Expected: no error.

- [ ] **Step 4: Commit**

```bash
git add src/preload src/renderer/src/hooks src/renderer/src/lib/toastBus.ts
git commit -m "feat: expose mtools preload API and useTools hook"
```

---

### Task 5: App shell UI (sidebar + grid + search)

**Files:**
- Create: `src/renderer/src/styles/theme.css`
- Create: `src/renderer/src/components/AppShell.tsx`
- Create: `src/renderer/src/components/Sidebar.tsx`
- Create: `src/renderer/src/components/SearchBar.tsx`
- Create: `src/renderer/src/components/ToolGrid.tsx`
- Create: `src/renderer/src/components/ToolCard.tsx`
- Create: `src/renderer/src/components/Toast.tsx`
- Create: `src/renderer/src/pages/HomePage.tsx`
- Modify: `src/renderer/src/App.tsx`, `main.tsx`

**Interfaces:**
- Consumes: `useTools()`, `CATEGORY_LABELS`, `Tool`
- Produces: Home route `/` with filter state `category` + `query`
- Card click:
  - `kind === 'builtin'` → `navigate(tool.route!)`
  - else → `launch(tool)` + toast on failure

- [ ] **Step 1: Theme CSS variables**

```css
:root {
  --bg: #fafafa;
  --surface: #ffffff;
  --border: #e8e8ea;
  --text: #1a1a1a;
  --muted: #888;
  --accent: #111;
  --radius: 8px;
  --sidebar-w: 200px;
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}
body { margin: 0; background: var(--bg); color: var(--text); }
```

- [ ] **Step 2: Build shell components**

Layout: fixed left sidebar (brand + category buttons), main column with SearchBar + 「添加工具」button placeholder (`onAdd` prop), ToolGrid of ToolCards (name, description, kind badge).

Filter logic in `HomePage`:

```ts
tools.filter(t => {
  const catOk = category === 'all' || t.category === category
  const q = query.trim().toLowerCase()
  const qOk = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  return catOk && qOk
})
```

- [ ] **Step 3: Wire React Router**

```tsx
<Routes>
  <Route element={<AppShell />}>
    <Route path="/" element={<HomePage />} />
    {/* tool routes added in Task 7 */}
  </Route>
</Routes>
```

- [ ] **Step 4: Visual check**

Run: `npm run dev`  
Expected: white UI, left categories, 8 builtin cards, search filters list.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src
git commit -m "feat: add white sidebar shell, tool grid, and search"
```

---

### Task 6: Add / edit / delete external tools modal

**Files:**
- Create: `src/renderer/src/components/AddToolModal.tsx`
- Modify: `HomePage.tsx`, `ToolCard.tsx`

**Interfaces:**
- Modal props: `{ open, initial?: Tool | null, onClose, onSave(tool: Tool): void }`
- Fields: name, description, category (default `external`), kind (`app`|`script`|`url`), target, args
- New id: `ext-${crypto.randomUUID()}`
- Card shows 编辑/删除 only when `!tool.builtin`

- [ ] **Step 1: Implement modal form validation**

Require non-empty `name` and `target`. For `url` kind, client-check `target.startsWith('http://') || target.startsWith('https://')` before save.

- [ ] **Step 2: Wire CRUD in HomePage**

```ts
async function persist(nextExternals: Tool[]) {
  await saveExternals(nextExternals)
  toastBus.show('已保存')
}
```

Delete confirms via `window.confirm` once (acceptable exception) or inline confirm row — use `window.confirm('确定删除该外挂？')` for v1.

- [ ] **Step 3: Manual test**

1. Add URL tool `https://example.com` → click launches browser  
2. Restart app → tool still listed  
3. Edit name → save → reflected  
4. Delete → gone  

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/AddToolModal.tsx src/renderer/src/pages/HomePage.tsx src/renderer/src/components/ToolCard.tsx
git commit -m "feat: add external tool create edit delete flow"
```

---

### Task 7: Tool host page + JSON / Base64 / URL tools

**Files:**
- Create: `src/renderer/src/components/ToolPageHeader.tsx`
- Create: `src/renderer/src/pages/ToolHostPage.tsx`
- Create: `src/renderer/src/tools/json/JsonTool.tsx`
- Create: `src/renderer/src/tools/base64/Base64Tool.tsx`
- Create: `src/renderer/src/tools/url/UrlTool.tsx`
- Modify: `App.tsx` routes

**Interfaces:**
- Routes: `/tools/json`, `/tools/base64`, `/tools/url`
- `ToolPageHeader({ title, description })` with back button → `/`
- Shared layout: textarea(s), primary/secondary buttons, inline error text

- [ ] **Step 1: ToolHostPage maps route → component**

```tsx
const map = {
  json: JsonTool,
  base64: Base64Tool,
  url: UrlTool,
  // later tasks extend
}
```

Or individual routes each rendering the tool wrapped with header.

- [ ] **Step 2: Implement JsonTool**

- Format: `JSON.stringify(JSON.parse(input), null, 2)`
- Minify: `JSON.stringify(JSON.parse(input))`
- On parse error: set `error` string, do not throw to UI
- Copy output via `navigator.clipboard.writeText` + toast

- [ ] **Step 3: Implement Base64Tool + UrlTool**

- Base64: encode `btoa(unescape(encodeURIComponent(text)))`, decode reverse; catch invalid decode
- URL: `encodeURIComponent` / `decodeURIComponent` with try/catch

- [ ] **Step 4: Manual test each tool main path + error path**

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/tools src/renderer/src/pages/ToolHostPage.tsx src/renderer/src/components/ToolPageHeader.tsx src/renderer/src/App.tsx
git commit -m "feat: add JSON Base64 and URL builtin tools"
```

---

### Task 8: Timestamp, Hash, UUID tools

**Files:**
- Create: `src/renderer/src/tools/timestamp/TimestampTool.tsx`
- Create: `src/renderer/src/tools/hash/HashTool.tsx`
- Create: `src/renderer/src/tools/uuid/UuidTool.tsx`
- Create: `src/renderer/src/tools/hash/hashText.ts`
- Create: `tests/hashTool.test.ts`
- Modify: routes / ToolHostPage map

**Interfaces:**
- `hashText(algo: 'MD5'|'SHA1'|'SHA256', text: string): string` using crypto-js
- Timestamp: detect seconds vs ms (if value `< 1e12` treat as seconds); show local datetime; 「现在」 fills current ms
- UUID: `crypto.randomUUID()` × N (1–20), join with `\n`

- [ ] **Step 1: Write hash unit test**

```ts
import { describe, it, expect } from 'vitest'
import { hashText } from '../src/renderer/src/tools/hash/hashText'

describe('hashText', () => {
  it('md5 of empty string', () => {
    expect(hashText('MD5', '')).toBe('d41d8cd98f00b204e9800998ecf8427e')
  })
})
```

- [ ] **Step 2: Run — FAIL then implement hashText — PASS**

- [ ] **Step 3: Implement three tool UIs + wire routes**

- [ ] **Step 4: Manual smoke**

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/tools/timestamp src/renderer/src/tools/hash src/renderer/src/tools/uuid tests/hashTool.test.ts
git commit -m "feat: add timestamp hash and uuid tools"
```

---

### Task 9: Diff + Regex tools

**Files:**
- Create: `src/renderer/src/tools/diff/diffLines.ts`
- Create: `src/renderer/src/tools/diff/DiffTool.tsx`
- Create: `src/renderer/src/tools/regex/RegexTool.tsx`
- Create: `tests/diffLines.test.ts`
- Modify: routes

**Interfaces:**
- `diffLines(a: string, b: string): Array<{ type: 'same'|'add'|'del'; text: string }>`
  - Line-based LCS or simple Myers-lite; v1 may use straightforward LCS on lines (OK for moderate text)
- RegexTool: parse flags from checkboxes `g|i|m`; `new RegExp(pattern, flags)` in try/catch; list `matchAll` results; highlight in preview via split/mark

- [ ] **Step 1: Write diffLines test**

```ts
import { describe, it, expect } from 'vitest'
import { diffLines } from '../src/renderer/src/tools/diff/diffLines'

describe('diffLines', () => {
  it('detects changed middle line', () => {
    const r = diffLines('a\nb\nc', 'a\nx\nc')
    expect(r.some(x => x.type === 'del' && x.text === 'b')).toBe(true)
    expect(r.some(x => x.type === 'add' && x.text === 'x')).toBe(true)
  })
})
```

- [ ] **Step 2: FAIL → implement → PASS**

- [ ] **Step 3: Build DiffTool + RegexTool UIs**

Diff: two textareas, result list with green/red line backgrounds (soft colors on white).

Regex: pattern input, flags, test text, matches panel; invalid regexp shows inline error.

- [ ] **Step 4: Manual smoke**

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/tools/diff src/renderer/src/tools/regex tests/diffLines.test.ts
git commit -m "feat: add text diff and regex tester tools"
```

---

### Task 10: Acceptance pass + README

**Files:**
- Create: `README.md`
- Modify: polish any UX gaps found in checklist

**Interfaces:**
- None new

- [ ] **Step 1: Run unit tests**

Run: `npm test`  
Expected: all PASS

- [ ] **Step 2: Run acceptance checklist from spec §8**

1. Sidebar + grid white UI  
2. All 8 builtins complete main flow  
3. External CRUD + launch  
4. Search + category filter  
5. Restart persistence  

- [ ] **Step 3: Write README**

Include: prerequisites (Node 18+), `npm install`, `npm run dev`, `npm run build`, feature list, link to design spec.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README and finish v1 acceptance pass"
```

---

## Spec Coverage Self-Review

| Spec requirement | Task |
|------------------|------|
| Electron + electron-vite + React + TS | Task 1 |
| Unified tool registry + merge | Task 2 |
| tools.json persistence | Task 3 |
| Launch app/script/url + http(s) only | Task 3 |
| Preload secure bridge | Task 4 |
| Layout A sidebar + grid + search | Task 5 |
| Add/edit/delete externals | Task 6 |
| 8 builtin tools | Tasks 7–9 |
| Toast / inline errors | Tasks 5–9 |
| White visual system | Task 5 |
| Acceptance + docs | Task 10 |
| No plugins/sync/dark/auto-update | Out of scope (not scheduled) |

## Placeholder / consistency notes

- Shared type location finalized in Task 3 as `src/shared/tool.ts` (renderer imports from shared; Task 2 paths updated during Task 3 if needed).
- Commit steps assume git repo initialized; if not, `git init` once in Task 1 before first commit.
- Only commit when the human asks to commit during execution, **or** when they already approved plan commits — if the session user rule forbids unsolicited commits, skip Step 5 commit bullets and stage only.
