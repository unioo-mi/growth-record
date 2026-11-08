import { ChevronRight, Link2, Paperclip } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { GrowthRecord } from '../types'
import { formatShortDate, truncate } from '../utils'
import { RecordIcon } from './RecordIcon'
import {
  DimensionBadge,
  MasteryMeter,
  ProjectStatusBadge,
  TypeBadge,
} from './ui'

interface RecordCardProps {
  record: GrowthRecord
  linkCount?: number
  attachmentCount?: number
  compact?: boolean
}

function recordExcerpt(record: GrowthRecord): string {
  switch (record.type) {
    case 'question':
      return record.scene ? `场景：${record.scene}` : '还没有记录触发场景'
    case 'knowledge':
      return record.takeaway || '还没有记录核心收获'
    case 'tool':
      return record.scenarios || '还没有记录适用场景'
    case 'project':
      return record.goal || '还没有填写项目目标'
  }
}

export function RecordCard({
  record,
  linkCount = 0,
  attachmentCount = 0,
  compact = false,
}: RecordCardProps) {
  const navigate = useNavigate()
  const goToDetail = () => navigate(`/record/${record.id}`)

  return (
    <article
      className={`record-card type-${record.type}${compact ? ' compact' : ''}`}
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          goToDetail()
        }
      }}
    >
      <div className="record-card-top">
        <div className="record-card-identity">
          <span className="record-type-icon">
            <RecordIcon type={record.type} size={17} />
          </span>
          <TypeBadge type={record.type} />
        </div>
        <span className="record-date">
          {record.type === 'project' && record.endDate
            ? `${formatShortDate(record.date)} — ${formatShortDate(record.endDate)}`
            : formatShortDate(record.date)}
        </span>
      </div>

      <div className="record-card-body">
        <h3>{record.title}</h3>
        {record.type === 'knowledge' && (
          <div className="record-card-badges">
            <DimensionBadge dimension={record.dimension} />
          </div>
        )}
        {record.type === 'tool' && (
          <div className="record-card-badges">
            <MasteryMeter mastery={record.mastery} />
          </div>
        )}
        {record.type === 'project' && (
          <div className="record-card-badges">
            <ProjectStatusBadge status={record.status} />
          </div>
        )}
        <p className="record-excerpt">{truncate(recordExcerpt(record), compact ? 72 : 118)}</p>
      </div>

      <div className="record-card-footer">
        <div className="record-stats">
          {linkCount > 0 && (
            <span>
              <Link2 size={14} />
              {linkCount} 个关联
            </span>
          )}
          {attachmentCount > 0 && (
            <span>
              <Paperclip size={14} />
              {attachmentCount} 个附件
            </span>
          )}
          {linkCount === 0 && attachmentCount === 0 && <span>等待更多连接</span>}
        </div>
        <ChevronRight className="record-chevron" size={18} />
      </div>
    </article>
  )
}
