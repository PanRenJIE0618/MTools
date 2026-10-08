import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { userDataPath } from './jsonStore'
import { listLocalAddresses } from './networkService'

let server: Server | null = null
let port = 0
let shareDir = ''

function htmlPage(files: string[], addresses: string[]): string {
  const list = files
    .map(
      (f) =>
        `<li><a href="/files/${encodeURIComponent(f)}">${f}</a></li>`
    )
    .join('')
  const ips = addresses.map((a) => `<code>http://${a}:${port}/</code>`).join('<br/>')
  return `<!doctype html><html><head><meta charset="utf-8"/><title>MTools 局域网传输</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px}code{background:#f4f5f7;padding:2px 6px;border-radius:4px}</style>
</head><body>
<h1>MTools 文件共享</h1>
<p>本机访问：</p><p>${ips}</p>
<form method="POST" action="/upload" enctype="multipart/form-data">
<label>上传文件 <input type="file" name="file"/></label>
<button type="submit">上传</button>
</form>
<h2>文件列表</h2>
<ul>${list || '<li>（空）</li>'}</ul>
</body></html>`
}

async function parseMultipart(
  req: import('node:http').IncomingMessage
): Promise<{ filename: string; data: Buffer } | null> {
  const chunks: Buffer[] = []
  for await (const c of req) chunks.push(c as Buffer)
  const buf = Buffer.concat(chunks)
  const ctype = req.headers['content-type'] || ''
  const m = /boundary=(.+)$/i.exec(ctype)
  if (!m) return null
  const boundary = `--${m[1]}`
  const parts = buf.toString('binary').split(boundary)
  for (const part of parts) {
    if (!part.includes('filename=')) continue
    const nameMatch = /filename="([^"]+)"/i.exec(part)
    if (!nameMatch) continue
    const idx = part.indexOf('\r\n\r\n')
    if (idx < 0) continue
    let body = part.slice(idx + 4)
    if (body.endsWith('\r\n')) body = body.slice(0, -2)
    if (body.endsWith('--')) body = body.slice(0, -2)
    if (body.endsWith('\r\n')) body = body.slice(0, -2)
    return { filename: basename(nameMatch[1]), data: Buffer.from(body, 'binary') }
  }
  return null
}

export async function startLanServer(): Promise<{
  ok: boolean
  port?: number
  urls?: string[]
  dir?: string
  error?: string
}> {
  if (server) {
    return {
      ok: true,
      port,
      dir: shareDir,
      urls: listLocalAddresses()
        .filter((a) => !a.internal)
        .map((a) => `http://${a.address}:${port}/`)
    }
  }
  shareDir = userDataPath('lan-share')
  await mkdir(shareDir, { recursive: true })

  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://127.0.0.1`)
      if (req.method === 'GET' && url.pathname === '/') {
        const files = await readdir(shareDir)
        const addrs = listLocalAddresses()
          .filter((a) => !a.internal)
          .map((a) => a.address)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(htmlPage(files, addrs.length ? addrs : ['127.0.0.1']))
        return
      }
      if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
        const name = decodeURIComponent(url.pathname.slice('/files/'.length))
        const filePath = join(shareDir, basename(name))
        if (!existsSync(filePath) || !statSync(filePath).isFile()) {
          res.writeHead(404)
          res.end('Not found')
          return
        }
        res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${basename(filePath)}"`
        })
        createReadStream(filePath).pipe(res)
        return
      }
      if (req.method === 'POST' && url.pathname === '/upload') {
        const parsed = await parseMultipart(req)
        if (!parsed) {
          res.writeHead(400)
          res.end('Bad upload')
          return
        }
        await writeFile(join(shareDir, parsed.filename), parsed.data)
        res.writeHead(302, { Location: '/' })
        res.end()
        return
      }
      res.writeHead(404)
      res.end('Not found')
    } catch (e) {
      res.writeHead(500)
      res.end(e instanceof Error ? e.message : 'error')
    }
  })

  await new Promise<void>((resolve, reject) => {
    server!.listen(0, '0.0.0.0', () => resolve())
    server!.on('error', reject)
  })
  const addr = server.address()
  port = typeof addr === 'object' && addr ? addr.port : 0
  return {
    ok: true,
    port,
    dir: shareDir,
    urls: listLocalAddresses()
      .filter((a) => !a.internal)
      .map((a) => `http://${a.address}:${port}/`)
  }
}

export async function stopLanServer(): Promise<{ ok: boolean }> {
  if (!server) return { ok: true }
  await new Promise<void>((resolve) => server!.close(() => resolve()))
  server = null
  port = 0
  return { ok: true }
}

export function lanStatus(): { running: boolean; port: number; urls: string[]; dir: string } {
  return {
    running: Boolean(server),
    port,
    dir: shareDir,
    urls: server
      ? listLocalAddresses()
          .filter((a) => !a.internal)
          .map((a) => `http://${a.address}:${port}/`)
      : []
  }
}

export async function listLanFiles(): Promise<string[]> {
  if (!shareDir) shareDir = userDataPath('lan-share')
  await mkdir(shareDir, { recursive: true })
  return readdir(shareDir)
}
