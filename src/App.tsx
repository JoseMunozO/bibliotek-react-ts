import { useState } from 'react'
import BooksPage from './pages/BooksPage'
import LoansPage from './pages/LoansPage'
import MembersPage from './pages/MembersPage'
import MostBorrowedPage from './pages/MostBorrowedPage'
import NotificationsPage from './pages/NotificationsPage'

const pages = {
  books: { label: 'Libros', Component: BooksPage },
  mostBorrowed: { label: 'Más prestados', Component: MostBorrowedPage },
  members: { label: 'Socios', Component: MembersPage },
  loans: { label: 'Préstamos', Component: LoansPage },
  notifications: { label: 'Notificaciones', Component: NotificationsPage },
}

type PageKey = keyof typeof pages

function App() {
  const [page, setPage] = useState<PageKey>('books')
  const { Component } = pages[page]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-6 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-900">Bibliotek</h1>
          <nav className="flex gap-1">
            {(Object.keys(pages) as PageKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setPage(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  key === page ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pages[key].label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Component />
      </main>
    </div>
  )
}

export default App
