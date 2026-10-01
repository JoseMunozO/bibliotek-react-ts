import { useState } from 'react'
import SessionBar from './components/SessionBar'
import BooksPage from './pages/BooksPage'
import LoansPage from './pages/LoansPage'
import MembersPage from './pages/MembersPage'
import MostBorrowedPage from './pages/MostBorrowedPage'
import MyAccountPage from './pages/MyAccountPage'
import NotificationsPage from './pages/NotificationsPage'
import { useSession, type Session } from './session'

const pages = {
  books: { label: 'Libros', Component: BooksPage, visible: () => true },
  mostBorrowed: { label: 'Más prestados', Component: MostBorrowedPage, visible: () => true },
  account: { label: 'Mi cuenta', Component: MyAccountPage, visible: (s: Session) => s.role === 'user' },
  members: { label: 'Socios', Component: MembersPage, visible: (s: Session) => s.can.viewMembers },
  loans: { label: 'Préstamos', Component: LoansPage, visible: (s: Session) => s.can.manageLoans },
  notifications: {
    label: 'Notificaciones',
    Component: NotificationsPage,
    visible: (s: Session) => s.can.manageNotifications,
  },
}

type PageKey = keyof typeof pages

function App() {
  const session = useSession()
  const [page, setPage] = useState<PageKey>('books')
  const visiblePages = (Object.keys(pages) as PageKey[]).filter((key) => pages[key].visible(session))
  // Si el rol cambia y la página actual ya no está permitida, se vuelve a Libros
  const current = visiblePages.includes(page) ? page : 'books'
  const { Component } = pages[current]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <h1 className="text-xl font-semibold text-slate-900">Bibliotek</h1>
          <nav className="flex flex-wrap gap-1">
            {visiblePages.map((key) => (
              <button
                key={key}
                onClick={() => setPage(key)}
                aria-current={key === current ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  key === current ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pages[key].label}
              </button>
            ))}
          </nav>
          <div className="ml-auto">
            <SessionBar />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* key: al cambiar de rol o de socio se remonta la página con datos nuevos */}
        <Component key={`${session.role}-${session.memberId}`} />
      </main>
    </div>
  )
}

export default App
