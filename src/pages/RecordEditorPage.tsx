import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, getOutgoingLinkIds, saveRecord } from '../db'
import {
  DIMENSIONS,
  DIMENSION_META,
  MASTERY_LEVELS,
  PROJECT_STATUS_META,
  RECORD_META,
  RECORD_TYPES,
} from '../constants'
import type {
  Attachment,
  GrowthRecord,
  PendingAttachment,
  ProjectRecord,
  RecordDraft,
  RecordType,
} from '../types'
import { createId, todayISO } from '../utils'
import { AttachmentEditor } from '../components/AttachmentEditor'
import { RecordIcon } from '../components/RecordIcon'
import { RelationPicker } from '../components/RelationPicker'
import { LoadingState } from '../components/ui'

function emptyDraft(): RecordDraft {
  return {
    title: '',
    date: todayISO(),
    scene: '',
    dimension: '智',
    takeaway: '',
    mastery: '正在练习',
    scenarios: '',
    endDate: '',
    goal: '',
    outcome: '',
    reflection: '',
    status: 'active',
  }
}

function draftFromRecord(record: GrowthRecord): RecordDraft {
  const draft = {
    ...emptyDraft(),
    title: record.title,
    date: record.date,
  }
  switch (record.type) {
    case 'question':
      return { ...draft, scene: record.scene }
    case 'knowledge':
      return { ...draft, dimension: record.dimension, takeaway: record.takeaway }
    case 'tool':
      return { ...draft, mastery: record.mastery, scenarios: record.scenarios }
    case 'project':
      return {
        ...draft,
        endDate: record.endDate,
        goal: record.goal,
        outcome: record.outcome,
        reflection: record.reflection,
        status: record.status,
      }
  }
}

function titleLabel(type: RecordType): string {
  return {
    question: '问题内容',
    knowledge: '主题',
    tool: '工具名称',
    project: '项目名称',
  }[type]
}

function dateLabel(type: RecordType): string {
  return {
    question: '发现问题日期',
    knowledge: '记录日期',
    tool: '首次学习时间',
    project: '项目开始时间',
  }[type]
}

function buildRecord(
  type: RecordType,
  draft: RecordDraft,
  existing?: GrowthRecord,
): GrowthRecord {
  const common = {
    id: existing?.id ?? createId(),
    title: draft.title.trim(),
    date: draft.date,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }
  switch (type) {
    case 'question':
      return { ...common, type, scene: draft.scene.trim() }
    case 'knowledge':
      return {
        ...common,
        type,
        dimension: draft.dimension,
        takeaway: draft.takeaway.trim(),
      }
    case 'tool':
      return {
        ...common,
        type,
        mastery: draft.mastery,
        scenarios: draft.scenarios.trim(),
      }
    case 'project':
      return {
        ...common,
        type,
        endDate: draft.endDate,
        goal: draft.goal.trim(),
        outcome: draft.outcome.trim(),
        reflection: draft.reflection.trim(),
        status: draft.status,
      }
  }
}

export function RecordEditorPage() {
  const { id: recordId, type: routeTypeParam } = useParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState<RecordDraft>(emptyDraft)
  const [selectedLinkIds, setSelectedLinkIds] = useState<string[]>([])
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([])
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([])
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<string[]>([])
  const [hydratedRecordId, setHydratedRecordId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof RecordDraft, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  const data = useLiveQuery(async () => {
    if (!recordId) return { mode: 'new' as const }
    const record = await db.records.get(recordId)
    if (!record) return { mode: 'missing' as const }
    const [linkIds, attachments] = await Promise.all([
      getOutgoingLinkIds(recordId),
      db.attachments.where('recordId').equals(recordId).toArray(),
    ])
    return { mode: 'existing' as const, record, linkIds, attachments }
  }, [recordId])

  useEffect(() => {
    if (!recordId || !data || data.mode !== 'existing') return
    if (hydratedRecordId === recordId) return
    setDraft(draftFromRecord(data.record))
    setSelectedLinkIds(data.linkIds)
    setExistingAttachments(data.attachments)
    setHydratedRecordId(recordId)
  }, [data, hydratedRecordId, recordId])

  if (!data) return <LoadingState label="正在准备记录…" />

  if (recordId) {
    if (data.mode === 'missing') {
      return (
        <div className="page narrow-page">
          <div className="empty-state">
            <h1>没有找到这条记录</h1>
            <p>它可能已经被删除。</p>
            <Link to="/" className="primary-button">返回首页</Link>
          </div>
        </div>
      )
    }
    if (data.mode !== 'existing' || hydratedRecordId !== recordId) {
      return <LoadingState label="正在准备记录…" />
    }
  }

  const recordType: RecordType | undefined =
    data.mode === 'existing' ? data.record.type : (routeTypeParam as RecordType | undefined)

  if (!recordType || !RECORD_TYPES.includes(recordType)) {
    return (
      <div className="page narrow-page">
        <div className="empty-state">
          <h1>未知的记录类型</h1>
          <Link to="/new" className="primary-button">选择记录类型</Link>
        </div>
      </div>
    )
  }

  const meta = RECORD_META[recordType]
  const editingRecord = data.mode === 'existing' ? data.record : undefined

  const updateDraft = <K extends keyof RecordDraft>(key: K, value: RecordDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof RecordDraft, string>> = {}
    if (!draft.title.trim()) nextErrors.title = `请填写${titleLabel(recordType)}`
    if (!draft.date) nextErrors.date = `请选择${dateLabel(recordType)}`
    if (recordType === 'project' && draft.endDate && draft.endDate < draft.date) {
      nextErrors.endDate = '结束日期不能早于开始日期'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError('')
    if (!validate()) return

    setSaving(true)
    try {
      const record = buildRecord(recordType, draft, editingRecord)
      await saveRecord({
        record,
        linkIds: selectedLinkIds,
        newAttachments: pendingAttachments,
        removedAttachmentIds,
      })
      navigate(`/record/${record.id}`, { replace: true })
    } catch (error) {
      console.error(error)
      setSubmitError('保存失败，可能是浏览器存储空间不足。请尝试删除一些附件后重试。')
      setSaving(false)
    }
  }

  const cancelTo = editingRecord ? `/record/${editingRecord.id}` : `/new`

  return (
    <div className="page editor-page">
      <div className="editor-topbar">
        <Link to={cancelTo} className="back-link">
          <ArrowLeft size={17} /> 取消
        </Link>
        <span className="editor-status">本地保存 · 刷新不丢失</span>
      </div>

      <header className={`editor-header type-${recordType}`}>
        <span className="library-icon">
          <RecordIcon type={recordType} size={24} strokeWidth={1.7} />
        </span>
        <div>
          <span className="eyebrow">{editingRecord ? '编辑记录' : '新建记录'}</span>
          <h1>{editingRecord ? editingRecord.title : `新建${meta.singular}`}</h1>
        </div>
      </header>

      <form className="record-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>基本信息</h2>
              <p>先记下最重要的部分，细节可以以后再补充。</p>
            </div>
          </div>

          <div className={`field${errors.title ? ' has-error' : ''}`}>
            <label htmlFor="record-title">{titleLabel(recordType)}</label>
            {recordType === 'question' ? (
              <textarea
                id="record-title"
                rows={3}
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                placeholder="例如：为什么月亮有时候白天也能看见？"
                autoFocus
              />
            ) : (
              <input
                id="record-title"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                placeholder={
                  recordType === 'knowledge'
                    ? '例如：影子的方向和光源位置有关'
                    : recordType === 'tool'
                      ? '例如：用观察记录表整理实验变化'
                      : '例如：阳台上的四季观察计划'
                }
                autoFocus
              />
            )}
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className={`field field-narrow${errors.date ? ' has-error' : ''}`}>
            <label htmlFor="record-date">{dateLabel(recordType)}</label>
            <input
              id="record-date"
              type="date"
              value={draft.date}
              onChange={(event) => updateDraft('date', event.target.value)}
            />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>

          {recordType === 'question' && (
            <div className="field">
              <label htmlFor="question-scene">触发场景</label>
              <input
                id="question-scene"
                value={draft.scene}
                onChange={(event) => updateDraft('scene', event.target.value)}
                placeholder="在哪里、做什么时产生的这个问题？"
              />
              <span className="field-hint">例如：晚饭后散步、读完一本绘本、做科学小实验时。</span>
            </div>
          )}

          {recordType === 'knowledge' && (
            <>
              <div className="field">
                <span className="field-label">所属维度</span>
                <div className="option-grid dimension-options">
                  {DIMENSIONS.map((dimension) => (
                    <button
                      key={dimension}
                      type="button"
                      className={`option-card ${DIMENSION_META[dimension].className}${
                        draft.dimension === dimension ? ' selected' : ''
                      }`}
                      onClick={() => updateDraft('dimension', dimension)}
                    >
                      <b>{dimension}</b>
                      <span>{DIMENSION_META[dimension].label}</span>
                      {draft.dimension === dimension && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="knowledge-takeaway">核心收获</label>
                <textarea
                  id="knowledge-takeaway"
                  rows={4}
                  value={draft.takeaway}
                  onChange={(event) => updateDraft('takeaway', event.target.value)}
                  placeholder="这次见闻、阅读或实践中，最重要的发现是什么？"
                />
              </div>
            </>
          )}

          {recordType === 'tool' && (
            <>
              <div className="field">
                <span className="field-label">掌握程度</span>
                <div className="segmented-options">
                  {MASTERY_LEVELS.map((mastery) => (
                    <button
                      key={mastery}
                      type="button"
                      className={draft.mastery === mastery ? 'selected' : ''}
                      onClick={() => updateDraft('mastery', mastery)}
                    >
                      {mastery}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label htmlFor="tool-scenarios">适用场景</label>
                <textarea
                  id="tool-scenarios"
                  rows={4}
                  value={draft.scenarios}
                  onChange={(event) => updateDraft('scenarios', event.target.value)}
                  placeholder="什么情况下可以使用它？它能帮助解决什么问题？"
                />
              </div>
            </>
          )}

          {recordType === 'project' && (
            <>
              <div className="field-row">
                <div className="field">
                  <span className="field-label">项目状态</span>
                  <div className="segmented-options">
                    {(Object.keys(PROJECT_STATUS_META) as ProjectRecord['status'][]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={draft.status === status ? 'selected' : ''}
                        onClick={() => updateDraft('status', status)}
                      >
                        {PROJECT_STATUS_META[status].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`field field-narrow${errors.endDate ? ' has-error' : ''}`}>
                  <label htmlFor="project-end">项目结束时间</label>
                  <input
                    id="project-end"
                    type="date"
                    value={draft.endDate}
                    onChange={(event) => updateDraft('endDate', event.target.value)}
                  />
                  {errors.endDate && <span className="field-error">{errors.endDate}</span>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="project-goal">项目目标</label>
                <textarea
                  id="project-goal"
                  rows={3}
                  value={draft.goal}
                  onChange={(event) => updateDraft('goal', event.target.value)}
                  placeholder="希望孩子在这个项目中理解什么、完成什么？"
                />
              </div>
              <div className="field">
                <label htmlFor="project-outcome">最终成果</label>
                <textarea
                  id="project-outcome"
                  rows={3}
                  value={draft.outcome}
                  onChange={(event) => updateDraft('outcome', event.target.value)}
                  placeholder="可以是一件作品、一次展示、一份报告，也可以是一个新发现。"
                />
              </div>
              <div className="field">
                <label htmlFor="project-reflection">项目复盘</label>
                <textarea
                  id="project-reflection"
                  rows={4}
                  value={draft.reflection}
                  onChange={(event) => updateDraft('reflection', event.target.value)}
                  placeholder="发生了什么？遇到了什么困难？如果再试一次会怎么做？"
                />
              </div>
            </>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h2>关联记录</h2>
              <p>把这次记录放进更大的成长网络里。</p>
            </div>
          </div>
          <RelationPicker
            currentType={recordType}
            selectedIds={selectedLinkIds}
            onChange={setSelectedLinkIds}
          />
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span>03</span>
            <div>
              <h2>图片、语音与文件</h2>
              <p>保留当时的画面、声音和作品。</p>
            </div>
          </div>
          <AttachmentEditor
            existingAttachments={existingAttachments}
            pendingAttachments={pendingAttachments}
            removedAttachmentIds={removedAttachmentIds}
            onAddPending={(items) => setPendingAttachments((current) => [...current, ...items])}
            onRemovePending={(index) =>
              setPendingAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
            }
            onRemoveExisting={(attachmentId) =>
              setRemovedAttachmentIds((current) => [...current, attachmentId])
            }
            onError={setSubmitError}
          />
        </section>

        {submitError && <div className="form-alert">{submitError}</div>}

        <div className="form-savebar">
          <span>所有内容只保存在当前浏览器中。</span>
          <div className="form-save-actions">
            <Link to={cancelTo} className="soft-button">取消</Link>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? <span className="button-spinner" /> : <Save size={17} />}
              {saving ? '正在保存…' : editingRecord ? '保存修改' : `保存${meta.singular}`}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
