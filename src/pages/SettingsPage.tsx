import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Database,
  Download,
  HardDrive,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react'
import { db, clearAllData } from '../db'
import { createBackupBlob, restoreBackup } from '../backup'
import { formatBytes } from '../utils'
import { LoadingState } from '../components/ui'

interface StorageState {
  usage: number
  quota: number
}

export function SettingsPage() {
  const importInput = useRef<HTMLInputElement>(null)
  const [storage, setStorage] = useState<StorageState | null>(null)
  const [persistence, setPersistence] = useState<'checking' | 'granted' | 'denied' | 'unsupported'>('checking')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState('')

  const counts = useLiveQuery(async () => {
    const [records, links, attachments] = await Promise.all([
      db.records.count(),
      db.links.count(),
      db.attachments.count(),
    ])
    return { records, links, attachments }
  }, [])

  const attachments = useLiveQuery(() => db.attachments.toArray(), [])

  useEffect(() => {
    const refreshStorage = async () => {
      if (!navigator.storage?.estimate) return
      const estimate = await navigator.storage.estimate()
      setStorage({
        usage: estimate.usage ?? 0,
        quota: estimate.quota ?? 0,
      })
    }
    const checkPersistence = async () => {
      if (!navigator.storage?.persisted) {
        setPersistence('unsupported')
        return
      }
      const persisted = await navigator.storage.persisted()
      setPersistence(persisted ? 'granted' : 'denied')
    }
    void refreshStorage()
    void checkPersistence()
  }, [counts?.attachments])

  const handlePersist = async () => {
    if (!navigator.storage?.persist) return
    try {
      const granted = await navigator.storage.persist()
      setPersistence(granted ? 'granted' : 'denied')
      setMessage(granted ? '已启用持久存储，浏览器会更谨慎地清理这份数据。' : '浏览器暂未授予持久存储权限。建议定期导出备份。')
    } catch {
      setMessage('无法申请持久存储权限，请定期导出备份。')
    }
  }

  const handleExport = async () => {
    try {
      setBusy('export')
      setMessage('')
      const blob = await createBackupBlob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `小小足迹-备份-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setMessage('备份已导出。请把文件保存在安全的位置。')
    } catch (error) {
      console.error(error)
      setMessage('导出失败，请检查浏览器是否允许下载文件。')
    } finally {
      setBusy('')
    }
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    const confirmed = window.confirm('导入备份会覆盖当前浏览器中的全部记录、关联和附件。确定继续吗？')
    if (!confirmed) {
      if (importInput.current) importInput.current.value = ''
      return
    }
    try {
      setBusy('import')
      setMessage('')
      await restoreBackup(file)
      setMessage('备份导入完成，当前数据已恢复。')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : '导入失败，请确认文件格式。')
    } finally {
      setBusy('')
      if (importInput.current) importInput.current.value = ''
    }
  }

  const handleClear = async () => {
    const confirmed = window.confirm('确定清空全部成长记录吗？此操作不可恢复，建议先导出备份。')
    if (!confirmed) return
    try {
      setBusy('clear')
      await clearAllData()
      setMessage('所有本地数据已清空。')
    } catch {
      setMessage('清空失败，请稍后重试。')
    } finally {
      setBusy('')
    }
  }

  if (!counts || !attachments) return <LoadingState label="正在检查本地存储…" />

  const attachmentBytes = attachments.reduce((sum, attachment) => sum + attachment.size, 0)
  const usagePercent = storage?.quota
    ? Math.min(100, (storage.usage / storage.quota) * 100)
    : 0

  return (
    <div className="page settings-page">
      <header className="settings-header">
        <span className="eyebrow">
          <ShieldCheck size={15} /> 本地优先
        </span>
        <h1>设置与备份</h1>
        <p>所有记录都保存在当前设备的浏览器中，不会上传到任何服务器。</p>
      </header>

      {message && <div className="settings-message">{message}</div>}

      <section className="settings-card storage-card">
        <div className="settings-card-heading">
          <span className="settings-icon"><HardDrive size={21} /></span>
          <div>
            <h2>存储空间</h2>
            <p>IndexedDB 的实际占用由浏览器管理。</p>
          </div>
        </div>

        <div className="storage-figures">
          <div><strong>{counts.records}</strong><span>条记录</span></div>
          <div><strong>{counts.links}</strong><span>条关联</span></div>
          <div><strong>{counts.attachments}</strong><span>个附件</span></div>
          <div><strong>{formatBytes(attachmentBytes)}</strong><span>附件大小</span></div>
        </div>

        <div className="storage-bar">
          <span style={{ width: `${Math.max(usagePercent, counts.records ? 1 : 0)}%` }} />
        </div>
        <div className="storage-bar-labels">
          <span>当前站点占用约 {formatBytes(storage?.usage ?? 0)}</span>
          <span>浏览器可用上限约 {formatBytes(storage?.quota ?? 0)}</span>
        </div>

        <div className="persistence-row">
          <div>
            <strong>持久存储</strong>
            <p>
              {persistence === 'granted'
                ? '已启用。浏览器不会轻易自动清理这份数据。'
                : persistence === 'denied'
                  ? '尚未启用。清理浏览器数据或存储空间不足时可能丢失记录。'
                  : persistence === 'unsupported'
                    ? '当前浏览器不支持申请持久存储。'
                    : '正在检查状态…'}
            </p>
          </div>
          {persistence !== 'granted' && persistence !== 'unsupported' && (
            <button type="button" className="soft-button" onClick={handlePersist}>
              申请持久存储
            </button>
          )}
        </div>
      </section>

      <section className="settings-card backup-card">
        <div className="settings-card-heading">
          <span className="settings-icon"><Database size={21} /></span>
          <div>
            <h2>数据备份</h2>
            <p>导出的 JSON 文件包含全部记录、关联和附件。建议定期备份。</p>
          </div>
        </div>

        <div className="settings-actions-row">
          <button type="button" className="primary-button" onClick={handleExport} disabled={Boolean(busy)}>
            <Download size={17} /> {busy === 'export' ? '正在导出…' : '导出完整备份'}
          </button>
          <button type="button" className="soft-button" onClick={() => importInput.current?.click()} disabled={Boolean(busy)}>
            <Upload size={17} /> {busy === 'import' ? '正在导入…' : '从备份恢复'}
          </button>
          <input
            ref={importInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => void handleImport(event.currentTarget.files?.[0])}
          />
        </div>
        <p className="field-hint">换设备时，可在新设备中打开应用后导入该备份文件。</p>
      </section>

      <section className="settings-card danger-card">
        <div className="settings-card-heading">
          <span className="settings-icon danger"><Trash2 size={21} /></span>
          <div>
            <h2>清除本地数据</h2>
            <p>删除当前浏览器中的全部成长记录。操作不可恢复。</p>
          </div>
        </div>
        <button type="button" className="danger-button" onClick={handleClear} disabled={Boolean(busy)}>
          <Trash2 size={17} /> {busy === 'clear' ? '正在清空…' : '清空全部数据'}
        </button>
      </section>

      <footer className="settings-footer">
        <strong>小小足迹</strong>
        <span>MVP · 本地单用户版本</span>
      </footer>
    </div>
  )
}
