import { useCallback, useEffect, useState } from 'react'
import { toastBus } from '../../lib/toastBus'

export default function NetworkTool(): React.JSX.Element {
  const [addrs, setAddrs] = useState<{ name: string; address: string; internal: boolean }[]>([])
  const [host, setHost] = useState('example.com')
  const [url, setUrl] = useState('https://www.baidu.com')
  const [dnsResult, setDnsResult] = useState('')
  const [latency, setLatency] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void window.mtools.netAddresses().then(setAddrs)
  }, [])

  const runDns = useCallback(async () => {
    const r = await window.mtools.netDns(host.trim())
    if (!r.ok) {
      setError(r.error || 'DNS 失败')
      setDnsResult('')
      return
    }
    setError('')
    setDnsResult(r.address || '')
  }, [host])

  const runLatency = useCallback(async () => {
    const r = await window.mtools.netLatency(url.trim())
    if (!r.ok) {
      setError(r.error || '探测失败')
      setLatency('')
      return
    }
    setError('')
    setLatency(`${r.ms} ms · HTTP ${r.status}`)
  }, [url])

  return (
    <div className="tool-panel">
      <h3 className="tool-field__label">本机网卡</h3>
      <ul className="rename-preview">
        {addrs.map((a) => (
          <li key={`${a.name}-${a.address}`}>
            <code>
              {a.name} · {a.address}
              {a.internal ? '（内部）' : ''}
            </code>
            <button
              type="button"
              className="tool-btn"
              style={{ marginLeft: 8 }}
              onClick={() => {
                void navigator.clipboard.writeText(a.address).then(() => toastBus.show('已复制 IP'))
              }}
            >
              复制
            </button>
          </li>
        ))}
      </ul>
      <label className="tool-field">
        <span className="tool-field__label">DNS 查询</span>
        <div className="tool-inline-row">
          <input className="tool-input tool-input--grow" value={host} onChange={(e) => setHost(e.target.value)} />
          <button type="button" className="tool-btn tool-btn--primary" onClick={() => void runDns()}>
            解析
          </button>
        </div>
      </label>
      {dnsResult ? <p>结果：<code>{dnsResult}</code></p> : null}
      <label className="tool-field">
        <span className="tool-field__label">HTTP 延迟</span>
        <div className="tool-inline-row">
          <input className="tool-input tool-input--grow" value={url} onChange={(e) => setUrl(e.target.value)} />
          <button type="button" className="tool-btn tool-btn--primary" onClick={() => void runLatency()}>
            探测
          </button>
        </div>
      </label>
      {latency ? <p>结果：{latency}</p> : null}
      {error ? <p className="tool-error">{error}</p> : null}
    </div>
  )
}
