import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { DIMENSION_META, MASTERY_VALUE, PROJECT_STATUS_META } from '../constants'
import type {
  Dimension,
  Mastery,
  ProjectStatus,
  RecordType,
} from '../types'
import { typeLabel } from '../utils'
import { RecordIcon } from './RecordIcon'

export function TypeBadge({ type }: { type: RecordType }) {
  return (
    <span className={`type-badge type-${type}`}>
      <RecordIcon type={type} size={13} />
      {typeLabel(type)}
    </span>
  )
}

export function DimensionBadge({ dimension }: { dimension: Dimension }) {
  return (
    <span className={`dimension-badge ${DIMENSION_META[dimension].className}`}>
      <b>{dimension}</b>
      <span>{DIMENSION_META[dimension].label}</span>
    </span>
  )
}

export function MasteryMeter({ mastery }: { mastery: Mastery }) {
  const value = MASTERY_VALUE[mastery]
  return (
    <span className="mastery-meter" title={`掌握程度：${mastery}`}>
      <span className="mastery-dots" aria-hidden="true">
        {[1, 2, 3, 4].map((level) => (
          <i key={level} className={level <= value ? 'filled' : ''} />
        ))}
      </span>
      <span>{mastery}</span>
    </span>
  )
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const meta = PROJECT_STATUS_META[status]
  return <span className={`status-badge ${meta.className}`}>{meta.label}</span>
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}

export function LoadingState({ label = '正在读取记录…' }: { label?: string }) {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
    </div>
  )
}

export function SectionHeading({
  title,
  count,
  action,
}: {
  title: string
  count?: number
  action?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {typeof count === 'number' && <span className="count-pill">{count}</span>}
      </div>
      {action}
    </div>
  )
}
