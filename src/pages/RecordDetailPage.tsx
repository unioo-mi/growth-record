import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Link2,
  Paperclip,
  Pencil,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, deleteRecordCascade, getRecordDetail } from '../db'
import { RECORD_META } from '../constants'
import type { LinkedRecord } from '../types'
import { formatDate, formatDateTime, formatShortDate, typeLabel } from '../utils'
import { AttachmentGallery } from '../components/AttachmentGallery'
import { RecordIcon } from '../components/RecordIcon'
import {
  DimensionBadge,
  LoadingState,
  MasteryMeter,
  ProjectStatusBadge,
  TypeBadge,
} from '../components/ui'

function LinkedRecordRow({ item }: { item: LinkedRecord }) {
  const { record, direction } = item
  return (
    <Link to={`/record/${record.id}`} className={`linked-record-row type-${record.type}`}>
      <span className="linked-record-icon">
        <RecordIcon type={record.type} size={17} />
      </span>
      <span className="linked-record-copy">
        <strong>{record.title}</strong>
        <small>
          {typeLabel(record.type)} · {formatShortDate(record.date)}
        </small>
      </span>
      <span className={`link-direction ${direction}`}>
        {direction === 'outgoing' ? '本记录关联' : '反向关联'}
      </span>
    </Link>
  )
}

export function RecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = useLiveQuery(async () => {
    if (!id) return { status: 'missing' as const }
    const result = await getRecordDetail(id)
    return result ? { status: 'ready' as const, data: result } : { status: 'missing' as const }
  }, [id])

  if (!detail) return <LoadingState label="正在打开记录…" />

  if (detail.status === 'missing') {
    return (
      <div className="page narrow-page">
        <div className="empty-state">
          <div className="empty-icon"><Link2 size={28} /></div>
          <h1>没有找到这条记录</h1>
          <p>它可能已经被删除，或链接已经失效。</p>
          <Link to="/" className="primary-button">返回首页</Link>
        </div>
      </div>
    )
  }

  const { record, linkedRecords, attachments } = detail.data
  const meta = RECORD_META[record.type]

  const handleDelete = async () => {
    const confirmed = window.confirm(`确定删除「${record.title}」吗？相关关联和附件也会一起删除。`)
    if (!confirmed) return
    try {
      await deleteRecordCascade(record.id)
      navigate(meta.route, { replace: true })
    } catch {
      window.alert('删除失败，请稍后重试。')
    }
  }

  return (
    <div className="page detail-page">
      <div className="detail-topbar">
        <Link to={meta.route} className="back-link detail-back-button" aria-label={`返回${meta.label}`}>
          <ArrowLeft size={17} /> 返回{meta.label}
        </Link>
        <div className="detail-actions">
          <Link to={`/record/${record.id}/edit`} className="soft-button">
            <Pencil size={16} /> 编辑
          </Link>
          <button type="button" className="icon-button danger-hover" onClick={handleDelete} aria-label="删除记录">
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      <article className="detail-card">
        <header className={`detail-header type-${record.type}`}>
          <div className="detail-type-row">
            <span className="detail-type-icon">
              <RecordIcon type={record.type} size={24} strokeWidth={1.7} />
            </span>
            <TypeBadge type={record.type} />
            {record.type === 'project' && <ProjectStatusBadge status={record.status} />}
          </div>
          <h1>{record.title}</h1>
          <div className="detail-meta-row">
            <span><CalendarDays size={15} /> {formatDate(record.date)}</span>
            <span><Clock3 size={15} /> 更新于 {formatDateTime(record.updatedAt)}</span>
          </div>
        </header>

        <div className="detail-layout">
          <div className="detail-main">
            {record.type === 'question' && (
              <section className="detail-content-section">
                <h2>触发场景</h2>
                <p className="detail-paragraph">{record.scene || '还没有记录触发场景。'}</p>
              </section>
            )}

            {record.type === 'knowledge' && (
              <>
                <section className="detail-content-section">
                  <h2>所属维度</h2>
                  <DimensionBadge dimension={record.dimension} />
                </section>
                <section className="detail-content-section">
                  <h2>核心收获</h2>
                  <p className="detail-paragraph">{record.takeaway || '还没有记录核心收获。'}</p>
                </section>
              </>
            )}

            {record.type === 'tool' && (
              <>
                <section className="detail-content-section">
                  <h2>掌握程度</h2>
                  <MasteryMeter mastery={record.mastery} />
                </section>
                <section className="detail-content-section">
                  <h2>适用场景</h2>
                  <p className="detail-paragraph">{record.scenarios || '还没有记录适用场景。'}</p>
                </section>
              </>
            )}

            {record.type === 'project' && (
              <>
                <section className="detail-content-section">
                  <h2>项目周期</h2>
                  <p className="detail-paragraph">
                    {formatDate(record.date)} {record.endDate ? `— ${formatDate(record.endDate)}` : '起，持续进行中'}
                  </p>
                </section>
                <section className="detail-content-section">
                  <h2>项目目标</h2>
                  <p className="detail-paragraph">{record.goal || '还没有填写项目目标。'}</p>
                </section>
                <section className="detail-content-section">
                  <h2>最终成果</h2>
                  <p className="detail-paragraph">{record.outcome || '项目成果还在生长中。'}</p>
                </section>
                <section className="detail-content-section">
                  <h2>项目复盘</h2>
                  <p className="detail-paragraph">{record.reflection || '完成项目后，可以在这里留下复盘与下一步想法。'}</p>
                </section>
              </>
            )}

            <section className="detail-content-section">
              <div className="detail-section-title">
                <h2>附件</h2>
                <span>{attachments.length}</span>
              </div>
              {attachments.length ? (
                <AttachmentGallery attachments={attachments} />
              ) : (
                <div className="detail-empty-inline">
                  <Paperclip size={19} />
                  <span>还没有图片、语音、视频或文件。</span>
                </div>
              )}
            </section>
          </div>

          <aside className="detail-sidebar">
            <section className="detail-side-card">
              <div className="detail-section-title">
                <h2>关联记录</h2>
                <span>{linkedRecords.length}</span>
              </div>
              {linkedRecords.length ? (
                <div className="linked-record-list">
                  {linkedRecords.map((item) => (
                    <LinkedRecordRow key={`${item.record.id}-${item.direction}`} item={item} />
                  ))}
                </div>
              ) : (
                <div className="detail-empty-inline vertical">
                  <Link2 size={20} />
                  <span>还没有关联记录</span>
                  <Link to={`/record/${record.id}/edit`} className="text-button compact">
                    去添加关联
                  </Link>
                </div>
              )}
            </section>

            <section className="detail-side-card record-info-card">
              <h2>记录信息</h2>
              <dl className="record-info-list">
                <div>
                  <dt>记录类型</dt>
                  <dd>{meta.singular}</dd>
                </div>
                <div>
                  <dt>创建时间</dt>
                  <dd>{formatDateTime(record.createdAt)}</dd>
                </div>
                <div>
                  <dt>最近更新</dt>
                  <dd>{formatDateTime(record.updatedAt)}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </article>
    </div>
  )
}

