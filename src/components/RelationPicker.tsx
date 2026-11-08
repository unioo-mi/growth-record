import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, Link2, Search, X } from 'lucide-react'
import { db } from '../db'
import { RECORD_META, RECORD_TYPES } from '../constants'
import type { GrowthRecord, RecordType } from '../types'
import { formatShortDate, recordSearchText, typeLabel } from '../utils'
import { RecordIcon } from './RecordIcon'

interface RelationPickerProps {
  currentType: RecordType
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function RelationPicker({
  currentType,
  selectedIds,
  onChange,
}: RelationPickerProps) {
  const records = useLiveQuery(async () => {
    const all = await db.records.toArray()
    return all.filter((record) => record.type !== currentType)
  }, [currentType], [])
  const [activeType, setActiveType] = useState<'all' | RecordType>('all')
  const [search, setSearch] = useState('')

  const selectedRecords = useMemo(() => {
    const selected = new Set(selectedIds)
    return records.filter((record) => selected.has(record.id))
  }, [records, selectedIds])

  const visibleRecords = useMemo(() => {
    const query = search.trim().toLowerCase()
    return records
      .filter((record) => activeType === 'all' || record.type === activeType)
      .filter((record) => !query || recordSearchText(record).includes(query))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [activeType, records, search])

  const availableTypes = RECORD_TYPES.filter((type) => type !== currentType)

  const toggle = (record: GrowthRecord) => {
    if (selectedIds.includes(record.id)) {
      onChange(selectedIds.filter((id) => id !== record.id))
    } else {
      onChange([...selectedIds, record.id])
    }
  }

  return (
    <div className="relation-picker">
      <div className="selected-relations">
        {selectedRecords.length === 0 ? (
          <p className="muted-copy">还没有关联记录。可以把好奇、知识、工具和项目串起来。</p>
        ) : (
          selectedRecords.map((record) => (
            <button
              key={record.id}
              type="button"
              className={`selected-relation type-${record.type}`}
              onClick={() => toggle(record)}
              title="移除关联"
            >
              <RecordIcon type={record.type} size={14} />
              <span>{record.title}</span>
              <X size={13} />
            </button>
          ))
        )}
      </div>

      <div className="relation-explorer">
        <div className="relation-tabs" role="tablist" aria-label="关联记录类型">
          <button
            type="button"
            className={activeType === 'all' ? 'active' : ''}
            onClick={() => setActiveType('all')}
          >
            全部
          </button>
          {availableTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={activeType === type ? 'active' : ''}
              onClick={() => setActiveType(type)}
            >
              {RECORD_META[type].singular}
            </button>
          ))}
        </div>

        <label className="relation-search">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索可关联的记录"
          />
        </label>

        <div className="relation-results">
          {visibleRecords.length === 0 ? (
            <div className="relation-empty">
              <Link2 size={20} />
              <span>{records.length === 0 ? '暂时没有其他模块的记录' : '没有匹配的记录'}</span>
            </div>
          ) : (
            visibleRecords.map((record) => {
              const selected = selectedIds.includes(record.id)
              return (
                <button
                  key={record.id}
                  type="button"
                  className={`relation-result${selected ? ' selected' : ''}`}
                  onClick={() => toggle(record)}
                >
                  <span className={`relation-result-icon type-${record.type}`}>
                    <RecordIcon type={record.type} size={15} />
                  </span>
                  <span className="relation-result-copy">
                    <strong>{record.title}</strong>
                    <small>
                      {typeLabel(record.type)} · {formatShortDate(record.date)}
                    </small>
                  </span>
                  <span className="relation-check">
                    {selected && <Check size={15} />}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
