import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

const base =
  'rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...props} />
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${base} ${className}`} {...props} />
}
