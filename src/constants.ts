import type { Dimension, Mastery, ProjectStatus, RecordType } from './types'

export const RECORD_META: Record<
  RecordType,
  { label: string; singular: string; description: string; route: string }
> = {
  question: {
    label: '问题库',
    singular: '问题',
    description: '收藏孩子的好奇、疑问和天马行空的猜想',
    route: '/questions',
  },
  knowledge: {
    label: '知识图谱库',
    singular: '知识',
    description: '按德智体美劳沉淀见闻、阅读与实践收获',
    route: '/knowledge',
  },
  tool: {
    label: '工具库',
    singular: '工具',
    description: '记录可以反复使用的技能、方法和工具',
    route: '/tools',
  },
  project: {
    label: '项目库',
    singular: '项目',
    description: '追踪长期好奇如何变成完整的实践项目',
    route: '/projects',
  },
}

export const RECORD_TYPES: RecordType[] = [
  'question',
  'knowledge',
  'tool',
  'project',
]

export const DIMENSIONS: Dimension[] = ['德', '智', '体', '美', '劳']

export const DIMENSION_META: Record<
  Dimension,
  { label: string; description: string; className: string }
> = {
  德: { label: '品德与责任', description: '善意、规则、合作与担当', className: 'dimension-de' },
  智: { label: '思考与探索', description: '观察、提问、阅读与创造', className: 'dimension-zhi' },
  体: { label: '身体与行动', description: '运动、劳动、勇气与坚持', className: 'dimension-ti' },
  美: { label: '审美与表达', description: '艺术、自然、想象与表达', className: 'dimension-mei' },
  劳: { label: '生活与实践', description: '动手、服务、整理与解决问题', className: 'dimension-lao' },
}

export const MASTERY_LEVELS: Mastery[] = [
  '刚刚接触',
  '正在练习',
  '基本掌握',
  '熟练运用',
]

export const MASTERY_VALUE: Record<Mastery, number> = {
  刚刚接触: 1,
  正在练习: 2,
  基本掌握: 3,
  熟练运用: 4,
}

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  active: { label: '进行中', className: 'status-active' },
  completed: { label: '已完成', className: 'status-completed' },
}
