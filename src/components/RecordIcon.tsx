import {
  CircleHelp,
  FolderKanban,
  Network,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { RecordType } from '../types'

const ICONS: Record<RecordType, LucideIcon> = {
  question: CircleHelp,
  knowledge: Network,
  tool: Wrench,
  project: FolderKanban,
}

interface RecordIconProps {
  type: RecordType
  size?: number
  strokeWidth?: number
}

export function RecordIcon({ type, size = 18, strokeWidth = 1.8 }: RecordIconProps) {
  const Icon = ICONS[type]
  return <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" />
}
