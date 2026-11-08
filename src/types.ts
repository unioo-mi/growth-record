export type RecordType = 'question' | 'knowledge' | 'tool' | 'project'
export type Dimension = '德' | '智' | '体' | '美' | '劳'
export type Mastery = '刚刚接触' | '正在练习' | '基本掌握' | '熟练运用'
export type ProjectStatus = 'active' | 'completed'
export type AttachmentKind = 'image' | 'audio' | 'video' | 'file'

export interface BaseRecord {
  id: string
  type: RecordType
  title: string
  date: string
  createdAt: number
  updatedAt: number
}

export interface QuestionRecord extends BaseRecord {
  type: 'question'
  scene: string
}

export interface KnowledgeRecord extends BaseRecord {
  type: 'knowledge'
  dimension: Dimension
  takeaway: string
}

export interface ToolRecord extends BaseRecord {
  type: 'tool'
  mastery: Mastery
  scenarios: string
}

export interface ProjectRecord extends BaseRecord {
  type: 'project'
  endDate: string
  goal: string
  outcome: string
  reflection: string
  status: ProjectStatus
}

export type GrowthRecord =
  | QuestionRecord
  | KnowledgeRecord
  | ToolRecord
  | ProjectRecord

export interface RecordLink {
  id?: number
  fromId: string
  toId: string
  createdAt: number
}

export interface Attachment {
  id: string
  recordId: string
  kind: AttachmentKind
  blob: Blob
  name: string
  mimeType: string
  size: number
  duration?: number
  createdAt: number
}

export interface PendingAttachment {
  kind: AttachmentKind
  file: File
  duration?: number
}

export interface LinkedRecord {
  record: GrowthRecord
  direction: 'outgoing' | 'incoming'
}

export interface RecordDetailData {
  record: GrowthRecord
  linkedRecords: LinkedRecord[]
  attachments: Attachment[]
}

export interface RecordDraft {
  title: string
  date: string
  scene: string
  dimension: Dimension
  takeaway: string
  mastery: Mastery
  scenarios: string
  endDate: string
  goal: string
  outcome: string
  reflection: string
  status: ProjectStatus
}

export interface SaveRecordInput {
  record: GrowthRecord
  linkIds: string[]
  newAttachments: PendingAttachment[]
  removedAttachmentIds: string[]
}
