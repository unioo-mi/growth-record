import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { RECORD_META, RECORD_TYPES } from '../constants'
import { RecordIcon } from '../components/RecordIcon'

const TYPE_HINTS: Record<(typeof RECORD_TYPES)[number], string> = {
  question: '一个为什么、一个猜想，或一次有趣的发现',
  knowledge: '今天读到、看到、听到或亲手验证了什么',
  tool: '一项已经学会，或正在练习的方法和技能',
  project: '一件值得持续投入、最终能留下作品的事',
}

export function NewRecordPage() {
  return (
    <div className="page new-record-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={17} /> 返回首页
      </Link>

      <header className="new-record-header">
        <span className="eyebrow">
          <Sparkles size={15} /> 捕捉此刻
        </span>
        <h1>今天想记下什么？</h1>
        <p>先选一种类型。之后随时可以把不同记录关联起来。</p>
      </header>

      <div className="new-type-grid">
        {RECORD_TYPES.map((type, index) => (
          <Link key={type} to={`/new/${type}`} className={`new-type-card type-${type}`}>
            <span className="new-type-index">0{index + 1}</span>
            <span className="new-type-icon">
              <RecordIcon type={type} size={28} strokeWidth={1.6} />
            </span>
            <span className="new-type-copy">
              <strong>{RECORD_META[type].singular}</strong>
              <span>{RECORD_META[type].description}</span>
              <small>{TYPE_HINTS[type]}</small>
            </span>
            <ArrowRight className="new-type-arrow" size={19} />
          </Link>
        ))}
      </div>
    </div>
  )
}
