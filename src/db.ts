import Dexie, { type Table } from 'dexie'
import type {
  Attachment,
  GrowthRecord,
  LinkedRecord,
  RecordDetailData,
  RecordLink,
  SaveRecordInput,
} from './types'
import { createId } from './utils'

class GrowthDatabase extends Dexie {
  records!: Table<GrowthRecord, string>
  links!: Table<RecordLink, number>
  attachments!: Table<Attachment, string>

  constructor() {
    super('growth-record-db')
    this.version(1).stores({
      records: 'id, type, date, dimension, mastery, status, updatedAt',
      links: '++id, fromId, toId, [fromId+toId], createdAt',
      attachments: 'id, recordId, kind, createdAt',
    })
  }
}

export const db = new GrowthDatabase()

export async function getOutgoingLinkIds(recordId: string): Promise<string[]> {
  const links = await db.links.where('fromId').equals(recordId).toArray()
  return links.map((link) => link.toId)
}

export async function getRecordDetail(recordId: string): Promise<RecordDetailData | undefined> {
  const record = await db.records.get(recordId)
  if (!record) return undefined

  const [outgoing, incoming, attachments] = await Promise.all([
    db.links.where('fromId').equals(recordId).toArray(),
    db.links.where('toId').equals(recordId).toArray(),
    db.attachments.where('recordId').equals(recordId).toArray(),
  ])

  const directions = new Map<string, LinkedRecord['direction']>()
  outgoing.forEach((link) => directions.set(link.toId, 'outgoing'))
  incoming.forEach((link) => {
    if (!directions.has(link.fromId)) directions.set(link.fromId, 'incoming')
  })

  const ids = [...directions.keys()]
  const linked = await db.records.bulkGet(ids)
  const linkedRecords = linked
    .filter((item): item is GrowthRecord => Boolean(item))
    .map((item) => ({
      record: item,
      direction: directions.get(item.id) ?? 'outgoing',
    }))
    .sort((a, b) => b.record.updatedAt - a.record.updatedAt)

  return {
    record,
    linkedRecords,
    attachments: attachments.sort((a, b) => a.createdAt - b.createdAt),
  }
}

export async function saveRecord(input: SaveRecordInput): Promise<void> {
  const now = Date.now()
  const { record, linkIds, newAttachments, removedAttachmentIds } = input

  await db.transaction('rw', db.records, db.links, db.attachments, async () => {
    await db.records.put({ ...record, updatedAt: now })

    const outgoing = await db.links.where('fromId').equals(record.id).toArray()
    const desiredIds = new Set(linkIds.filter((id) => id !== record.id))
    const currentTargetIds = new Set(outgoing.map((link) => link.toId))

    const staleLinkIds = outgoing
      .filter((link) => !desiredIds.has(link.toId))
      .map((link) => link.id)
      .filter((id): id is number => typeof id === 'number')

    if (staleLinkIds.length) {
      await db.links.bulkDelete(staleLinkIds)
    }

    for (const targetId of desiredIds) {
      if (currentTargetIds.has(targetId)) continue
      const reverseExists = await db.links
        .where('toId')
        .equals(record.id)
        .filter((link) => link.fromId === targetId)
        .first()
      if (!reverseExists) {
        await db.links.add({
          fromId: record.id,
          toId: targetId,
          createdAt: now,
        })
      }
    }

    if (removedAttachmentIds.length) {
      await db.attachments.bulkDelete(removedAttachmentIds)
    }

    if (newAttachments.length) {
      const attachmentRows: Attachment[] = newAttachments.map((pending) => ({
        id: createId(),
        recordId: record.id,
        kind: pending.kind,
        blob: pending.file,
        name: pending.file.name,
        mimeType: pending.file.type || 'application/octet-stream',
        size: pending.file.size,
        duration: pending.duration,
        createdAt: Date.now(),
      }))
      await db.attachments.bulkAdd(attachmentRows)
    }
  })
}

export async function deleteRecordCascade(recordId: string): Promise<void> {
  await db.transaction('rw', db.records, db.links, db.attachments, async () => {
    const relatedLinks = await db.links
      .filter((link) => link.fromId === recordId || link.toId === recordId)
      .toArray()
    const linkIds = relatedLinks
      .map((link) => link.id)
      .filter((id): id is number => typeof id === 'number')

    if (linkIds.length) await db.links.bulkDelete(linkIds)

    const attachmentIds = await db.attachments
      .where('recordId')
      .equals(recordId)
      .primaryKeys()
    if (attachmentIds.length) await db.attachments.bulkDelete(attachmentIds)

    await db.records.delete(recordId)
  })
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.records, db.links, db.attachments, async () => {
    await db.records.clear()
    await db.links.clear()
    await db.attachments.clear()
  })
}
