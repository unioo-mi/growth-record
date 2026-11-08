import { db } from './db'
import type { Attachment, GrowthRecord, RecordLink } from './types'

type BackupAttachment = Omit<Attachment, 'blob'> & { dataUrl: string }

interface BackupFile {
  format: 'growth-record-backup'
  version: 1
  exportedAt: string
  records: GrowthRecord[]
  links: RecordLink[]
  attachments: BackupAttachment[]
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('读取附件失败'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(',')
  if (!payload) throw new Error('附件数据不完整')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const binary = window.atob(payload)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return new Blob([bytes], {
    type: mimeMatch?.[1] || 'application/octet-stream',
  })
}

export async function createBackupBlob(): Promise<Blob> {
  const [records, links, attachments] = await Promise.all([
    db.records.toArray(),
    db.links.toArray(),
    db.attachments.toArray(),
  ])

  const encodedAttachments: BackupAttachment[] = []
  for (const attachment of attachments) {
    const { blob, ...metadata } = attachment
    encodedAttachments.push({
      ...metadata,
      dataUrl: await blobToDataUrl(blob),
    })
  }

  const backup: BackupFile = {
    format: 'growth-record-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    records,
    links,
    attachments: encodedAttachments,
  }

  return new Blob([JSON.stringify(backup)], {
    type: 'application/json;charset=utf-8',
  })
}

export async function restoreBackup(file: File): Promise<void> {
  const parsed = JSON.parse(await file.text()) as Partial<BackupFile>
  if (
    parsed.format !== 'growth-record-backup' ||
    parsed.version !== 1 ||
    !Array.isArray(parsed.records) ||
    !Array.isArray(parsed.links) ||
    !Array.isArray(parsed.attachments)
  ) {
    throw new Error('这不是有效的成长记录备份文件')
  }

  const attachments: Attachment[] = parsed.attachments.map((item) => {
    if (!item.dataUrl || !item.id || !item.recordId) {
      throw new Error('备份中的附件信息不完整')
    }
    const { dataUrl, ...metadata } = item
    return {
      ...metadata,
      blob: dataUrlToBlob(dataUrl),
    }
  })

  await db.transaction('rw', db.records, db.links, db.attachments, async () => {
    await db.records.clear()
    await db.links.clear()
    await db.attachments.clear()
    if (parsed.records?.length) await db.records.bulkPut(parsed.records)
    if (parsed.links?.length) await db.links.bulkPut(parsed.links)
    if (attachments.length) await db.attachments.bulkPut(attachments)
  })
}
