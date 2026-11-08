import type { AttachmentKind, GrowthRecord, RecordType } from './types'

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function todayISO(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export function formatDate(value: string): string {
  if (!value) return '未设置日期'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return `${year}年${month}月${day}日`
}

export function formatShortDate(value: string): string {
  if (!value) return '未设置'
  const [, month, day] = value.split('-').map(Number)
  if (!month || !day) return value
  return `${month}月${day}日`
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function truncate(text: string, length = 110): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized
}

export function recordSearchText(record: GrowthRecord): string {
  const common = [record.title, record.date]
  switch (record.type) {
    case 'question':
      return [...common, record.scene].join(' ').toLowerCase()
    case 'knowledge':
      return [...common, record.dimension, record.takeaway].join(' ').toLowerCase()
    case 'tool':
      return [...common, record.mastery, record.scenarios].join(' ').toLowerCase()
    case 'project':
      return [
        ...common,
        record.endDate,
        record.goal,
        record.outcome,
        record.reflection,
        record.status,
      ]
        .join(' ')
        .toLowerCase()
  }
}

export function typeLabel(type: RecordType): string {
  return {
    question: '问题',
    knowledge: '知识',
    tool: '工具',
    project: '项目',
  }[type]
}

export function attachmentLabel(kind: AttachmentKind): string {
  return {
    image: '图片',
    audio: '语音',
    video: '短视频',
    file: '文件',
  }[kind]
}

export function detectAttachmentKind(file: File): AttachmentKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function sortByDateDesc(records: GrowthRecord[]): GrowthRecord[] {
  return [...records].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date)
    return dateCompare || b.updatedAt - a.updatedAt
  })
}
