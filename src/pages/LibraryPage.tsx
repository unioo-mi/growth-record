import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { db } from '../db'
import {
  DIMENSIONS,
  DIMENSION_META,
  MASTERY_LEVELS,
  PROJECT_STATUS_META,
  RECORD_META,
} from '../constants'
import type { RecordType } from '../types'
import { recordSearchText, sortByDateDesc } from '../utils'
import { RecordCard } from '../components/RecordCard'
import { RecordIcon } from '../components/RecordIcon'
import { EmptyState, LoadingState } from '../components/ui'

interface LibraryPageProps {
  type: RecordType
}

interface FilterOption {
  value: string
  label: string
}

function getFilterOptions(type: RecordType): FilterOption[] {
  if (type === 'knowledge') {
    return [
      { value: 'all', label: '全部维度' },
      ...DIMENSIONS.map((dimension) => ({
        value: dimension,
        label: `${dimension} · ${DIMENSION_META[dimension].label}`,
      })),
    ]
  }
  if (type === 'tool') {
    return [
      { value: 'all', label: '全部程度' },
      ...MASTERY_LEVELS.map((mastery) => ({ value: mastery, label: mastery })),
    ]
  }
  if (type === 'project') {
    return [
      { value: 'all', label: '全部项目' },
      { value: 'active', label: PROJECT_STATUS_META.active.label },
      { value: 'completed', label: PROJECT_STATUS_META.completed.label },
    ]
  }
  return []
}

export function LibraryPage({ type }: LibraryPageProps) {
  const meta = RECORD_META[type]
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const dimension = searchParams.get('dimension')
    if (type === 'knowledge' && dimension && (DIMENSIONS as readonly string[]).includes(dimension)) {
      setFilter(dimension)
    }
  }, [searchParams, type])

  const data = useLiveQuery(async () => {
    const [records, links, attachments] = await Promise.all([
      db.records.where('type').equals(type).toArray(),
      db.links.toArray(),
      db.attachments.toArray(),
    ])
    return { records, links, attachments }
  }, [type])

  if (!data) return <LoadingState label={`正在读取${meta.label}…`} />

  const typeRecords = sortByDateDesc(data.records)
  const linkCounts = new Map<string, number>()
  data.links.forEach((link) => {
    linkCounts.set(link.fromId, (linkCounts.get(link.fromId) ?? 0) + 1)
    linkCounts.set(link.toId, (linkCounts.get(link.toId) ?? 0) + 1)
  })
  const attachmentCounts = new Map<string, number>()
  data.attachments.forEach((attachment) => {
    attachmentCounts.set(
      attachment.recordId,
      (attachmentCounts.get(attachment.recordId) ?? 0) + 1,
    )
  })

  const query = search.trim().toLowerCase()
  const visibleRecords = typeRecords.filter((record) => {
    if (query && !recordSearchText(record).includes(query)) return false
    if (filter === 'all') return true
    if (record.type === 'knowledge') return record.dimension === filter
    if (record.type === 'tool') return record.mastery === filter
    if (record.type === 'project') return record.status === filter
    return true
  })

  const filterOptions = getFilterOptions(type)

  const dimensionCounts = DIMENSIONS.map((dimension) => ({
    dimension,
    count: typeRecords.filter(
      (record) => record.type === 'knowledge' && record.dimension === dimension,
    ).length,
  }))

  return (
    <div className="page library-page">
      <header className={`library-header type-${type}`}>
        <div className="library-title-block">
          <span className="library-icon">
            <RecordIcon type={type} size={28} strokeWidth={1.6} />
          </span>
          <div>
            <span className="eyebrow">成长资料库</span>
            <h1>{meta.label}</h1>
            <p>{meta.description}</p>
          </div>
        </div>
        <Link to={`/new/${type}`} className="primary-button">
          <Plus size={18} /> 新建{meta.singular}
        </Link>
      </header>

      {type === 'knowledge' && (
        <section className="dimension-summary" aria-label="德智体美劳分布">
          {dimensionCounts.map(({ dimension, count }) => (
            <button
              key={dimension}
              type="button"
              className={`dimension-summary-card ${DIMENSION_META[dimension].className}${
                filter === dimension ? ' active' : ''
              }`}
              onClick={() => setFilter(filter === dimension ? 'all' : dimension)}
            >
              <span className="dimension-summary-letter">{dimension}</span>
              <span>
                <strong>{DIMENSION_META[dimension].label}</strong>
                <small>{count} 条</small>
              </span>
            </button>
          ))}
        </section>
      )}

      <section className="library-toolbar">
        <label className="library-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`搜索${meta.singular}的主题、场景或内容`}
            aria-label={`搜索${meta.singular}`}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="清空搜索">
              <X size={16} />
            </button>
          )}
        </label>

        {filterOptions.length > 0 && (
          <div className="filter-cluster">
            <span className="filter-label">
              <SlidersHorizontal size={15} /> 筛选
            </span>
            <div className="filter-pills">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={filter === option.value ? 'active' : ''}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <div className="library-result-meta">
        <span>
          共 <strong>{visibleRecords.length}</strong> 条{meta.singular}记录
        </span>
        {(search || filter !== 'all') && (
          <button
            type="button"
            className="text-button compact"
            onClick={() => {
              setSearch('')
              setFilter('all')
            }}
          >
            清除筛选
          </button>
        )}
      </div>

      {typeRecords.length === 0 ? (
        <EmptyState
          icon={<RecordIcon type={type} size={30} />}
          title={`还没有${meta.singular}记录`}
          description={`${meta.description}。从一条简单的记录开始就好。`}
          action={
            <Link to={`/new/${type}`} className="primary-button">
              <Plus size={17} /> 新建{meta.singular}
            </Link>
          }
        />
      ) : visibleRecords.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="没有找到匹配记录"
          description="换一个关键词，或清除当前筛选条件再试试。"
          action={
            <button
              type="button"
              className="soft-button"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              清除筛选
            </button>
          }
        />
      ) : (
        <div className="record-grid">
          {visibleRecords.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              linkCount={linkCounts.get(record.id) ?? 0}
              attachmentCount={attachmentCounts.get(record.id) ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}


