import type { ReactNode } from 'react'

const styles = {
  error: 'bg-red-50 text-red-700',
  success: 'bg-green-50 text-green-700',
}

interface Props {
  type?: keyof typeof styles
  children: ReactNode
}

export default function Alert({ type = 'error', children }: Props) {
  return <p className={`rounded-lg p-3 text-sm ${styles[type]}`}>{children}</p>
}
