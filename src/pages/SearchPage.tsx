import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Sparkles, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../db'
import { recordSearchText, sortByDateDesc } from '../utils'
import { RecordCard } from '../components/RecordCard'
import { EmptyState, LoadingState } from '../components/ui'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  const data = useLiveQuery(async () => {
    const [records, links, attachments] = await Promise.all([
      db.records.toArray(),
      db.links.toArray(),
      db.attachments.toArray(),
    ])
    return { records, links, attachments }
  }, [])

  const results = useMemo(() => {
    if (!data) return []
    const normalized = query.trim().toLowerCase()
    const filtered = normalized
      ? data.records.filter((record) => recordSearchText(record).includes(normalized))
      : data.records
    return sortByDateDesc(filtered)
  }, [data, query])

  if (!data) return <LoadingState label="正在搜索记录…" />

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

  const updateQuery = (value: string) => {
    setQuery(value)
    if (value.trim()) setSearchParams({ q: value })
    else setSearchParams({})
  }

  return (
    <div className="page search-page">
      <header className="search-header">
        <span className="eyebrow">
          <Sparkles size={15} /> 找到一条线索
        </span>
        <h1>搜索全部记录</h1>
        <p>按问题、收获、场景、工具和项目内容进行搜索。</p>
      </header>

      <label className="global-search-box">
        <Search size={22} />
        <input
          value={query}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="输入关键词，例如：影子、合作、植物…"
          autoFocus
        />
        {query && (
          <button type="button" className="clear-search" onClick={() => updateQuery('')} aria-label="清空搜索">
            <X size={18} />
          </button>
        )}
      </label>

      <div className="search-result-meta">
        <span>
          {query.trim() ? `找到 ${results.length} 条结果` : `共 ${data.records.length} 条记录，按日期浏览`}
        </span>
      </div>

      {data.records.length === 0 ? (
        <EmptyState
          icon={<Sparkles size={28} />}
          title="还没有可以搜索的记录"
          description="先记录一个今天发生的小问题或小发现吧。"
        />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<Search size={28} />}
          title="没有找到匹配内容"
          description="试试更短的关键词，或换一个描述方式。"
          action={
            <button type="button" className="soft-button" onClick={() => updateQuery('')}>
              查看全部记录
            </button>
          }
        />
      ) : (
        <div className="record-grid">
          {results.map((record) => (
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
