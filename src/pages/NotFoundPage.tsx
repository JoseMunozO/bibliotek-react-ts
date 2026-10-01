import { Link } from 'react-router'

export default function NotFoundPage({ message = 'Esta página no existe.' }: { message?: string }) {
  return (
    <div className="space-y-3 py-10 text-center">
      <p className="text-4xl font-semibold text-slate-300">404</p>
      <p className="text-slate-600">{message}</p>
      <Link to="/libros" className="inline-block text-sm font-medium text-indigo-600 hover:underline">
        Ir a libros
      </Link>
    </div>
  )
}
