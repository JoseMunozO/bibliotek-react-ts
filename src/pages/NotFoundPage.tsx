import { Link } from 'react-router'

export default function NotFoundPage({ message = 'Sidan finns inte.' }: { message?: string }) {
  return (
    <div className="space-y-3 py-10 text-center">
      <p className="text-4xl font-semibold text-faint">404</p>
      <p className="text-ink-soft">{message}</p>
      <Link to="/bocker" className="inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        Till böckerna
      </Link>
    </div>
  )
}
