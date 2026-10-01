import type { ReactNode } from 'react'

const colors = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  gray: 'bg-slate-100 text-slate-600',
}

export type BadgeColor = keyof typeof colors

interface Props {
  color?: BadgeColor
  children: ReactNode
}

export default function Badge({ color = 'gray', children }: Props) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>{children}</span>
}
