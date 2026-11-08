import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CircleHelp,
  FolderKanban,
  Link2,
  Network,
  Plus,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { db } from '../db'
import { DIMENSIONS, DIMENSION_META, RECORD_META, RECORD_TYPES } from '../constants'
import type { ProjectRecord, RecordType } from '../types'
import { sortByDateDesc } from '../utils'
import { RecordCard } from '../components/RecordCard'
import { RecordIcon } from '../components/RecordIcon'
import { EmptyState, LoadingState, ProjectStatusBadge, SectionHeading } from '../components/ui'

const TYPE_ICONS = {
  question: CircleHelp,
  knowledge: Network,
  tool: Wrench,
  project: FolderKanban,
}

export function HomePage() {
  const data = useLiveQuery(async () => {
    const [records, links, attachments] = await Promise.all([
      db.records.toArray(),
      db.links.toArray(),
      db.attachments.toArray(),
    ])
    return { records, links, attachments }
  }, [])

  if (!data) return <LoadingState />

  const { records, links, attachments } = data
  const recentRecords = sortByDateDesc(records).slice(0, 6)
  const activeProjects = records
    .filter((record): record is ProjectRecord => record.type === 'project' && record.status === 'active')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3)

  const linkCounts = new Map<string, number>()
  links.forEach((link) => {
    linkCounts.set(link.fromId, (linkCounts.get(link.fromId) ?? 0) + 1)
    linkCounts.set(link.toId, (linkCounts.get(link.toId) ?? 0) + 1)
  })
  const attachmentCounts = new Map<string, number>()
  attachments.forEach((attachment) => {
    attachmentCounts.set(
      attachment.recordId,
      (attachmentCounts.get(attachment.recordId) ?? 0) + 1,
    )
  })

  const dimensionCounts = DIMENSIONS.map((dimension) => ({
    dimension,
    count: records.filter(
      (record) => record.type === 'knowledge' && record.dimension === dimension,
    ).length,
  }))
  const maxDimensionCount = Math.max(1, ...dimensionCounts.map((item) => item.count))

  return (
    <div className="page home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={15} /> 今天也值得被记住
          </span>
          <h1>
            让每一次好奇，
            <br />
            都留下成长的足迹。
          </h1>
          <p>
            把问题、知识、工具和项目连在一起，慢慢看见孩子如何认识世界，也如何成为自己。
          </p>
          <div className="hero-actions">
            <Link to="/new" className="primary-button">
              <Plus size={18} /> 记录新发现
            </Link>
            <Link to="/projects" className="text-button">
              看看长期项目 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-note-card" aria-hidden="true">
          <span className="hero-note-pin" />
          <span className="hero-note-date">成长手记</span>
          <p>“妈妈，为什么影子会跟着我跑？”</p>
          <div className="hero-note-line" />
          <div className="hero-note-line short" />
          <span className="hero-note-tag"># 好奇心</span>
        </div>
      </section>

      <section className="stats-grid" aria-label="记录概览">
        {RECORD_TYPES.map((type) => {
          const count = records.filter((record) => record.type === type).length
          const Icon = TYPE_ICONS[type as RecordType]
          return (
            <Link key={type} to={RECORD_META[type].route} className={`stat-card type-${type}`}>
              <span className="stat-icon">
                <Icon size={21} strokeWidth={1.8} />
              </span>
              <span className="stat-copy">
                <strong>{count}</strong>
                <span>{RECORD_META[type].singular}</span>
              </span>
              <ArrowRight size={16} className="stat-arrow" />
            </Link>
          )
        })}
      </section>

      <div className="home-grid">
        <section className="surface-card dimension-overview">
          <SectionHeading title="五维成长光谱" count={dimensionCounts.reduce((sum, item) => sum + item.count, 0)} />
          <p className="section-description">知识不只来自书本，也来自每一次动手、运动和合作。</p>
          <div className="dimension-bars">
            {dimensionCounts.map(({ dimension, count }) => (
              <Link
                key={dimension}
                to={`/knowledge?dimension=${dimension}`}
                className="dimension-bar-row"
              >
                <span className={`dimension-letter ${DIMENSION_META[dimension].className}`}>
                  {dimension}
                </span>
                <span className="dimension-bar-copy">
                  <span>
                    <strong>{DIMENSION_META[dimension].label}</strong>
                    <small>{count} 条记录</small>
                  </span>
                  <span className="dimension-track">
                    <i
                      className={DIMENSION_META[dimension].className}
                      style={{ width: `${Math.max(5, (count / maxDimensionCount) * 100)}%` }}
                    />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="surface-card connection-overview">
          <span className="connection-ornament">
            <Link2 size={28} />
          </span>
          <p className="eyebrow">连接正在发生</p>
          <h2>{links.length} 条跨模块关联</h2>
          <p>
            一个问题可以长出知识，知识可以变成工具，最后由一个项目把旅程串起来。
          </p>
          <Link to="/search" className="text-button">
            浏览全部记录 <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      <section className="home-section">
        <SectionHeading
          title="最近记录"
          count={records.length}
          action={
            <Link to="/search" className="text-button">
              查看全部 <ArrowRight size={15} />
            </Link>
          }
        />
        {recentRecords.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={28} />}
            title="从第一个小问题开始"
            description="不需要写得完整，先记下此刻的好奇，其他连接会慢慢长出来。"
            action={
              <Link to="/new/question" className="primary-button">
                <Plus size={17} /> 记录第一个问题
              </Link>
            }
          />
        ) : (
          <div className="record-grid">
            {recentRecords.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                linkCount={linkCounts.get(record.id) ?? 0}
                attachmentCount={attachmentCounts.get(record.id) ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <SectionHeading
          title="正在生长的项目"
          count={activeProjects.length}
          action={
            <Link to="/projects" className="text-button">
              项目管理 <ArrowRight size={15} />
            </Link>
          }
        />
        {activeProjects.length === 0 ? (
          <div className="project-invite">
            <div className="project-invite-icon">
              <FolderKanban size={22} />
            </div>
            <div>
              <strong>还没有进行中的项目</strong>
              <p>当一个兴趣值得持续几周甚至几个月，就可以把它变成一个小项目。</p>
            </div>
            <Link to="/new/project" className="soft-button">
              创建项目
            </Link>
          </div>
        ) : (
          <div className="active-project-list">
            {activeProjects.map((project) => (
              <Link key={project.id} to={`/record/${project.id}`} className="active-project-row">
                <span className="active-project-icon">
                  <RecordIcon type={project.type} size={18} />
                </span>
                <span className="active-project-copy">
                  <strong>{project.title}</strong>
                  <small>
                    {project.date} {project.endDate ? `— ${project.endDate}` : '起'}
                  </small>
                </span>
                <ProjectStatusBadge status={project.status} />
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

