import type { ReactNode } from 'react'

const colors = {
  green: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  red: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  gray: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

export type BadgeColor = keyof typeof colors

interface Props {
  color?: BadgeColor
  children: ReactNode
}

export default function Badge({ color = 'gray', children }: Props) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color]}`}>{children}</span>
}
