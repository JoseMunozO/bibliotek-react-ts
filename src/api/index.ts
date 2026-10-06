import { get, post, put } from './client'
import type {
  BookDTO,
  BookDetailsDTO,
  BookStatisticsDTO,
  CreateLoanRequest,
  CreateMemberRequest,
  CreateNotificationRequest,
  CreateReviewRequest,
  FineDTO,
  LoanDTO,
  LoanReturnDTO,
  MemberDTO,
  MemberProfileDTO,
  NotificationDTO,
  OverdueLoanDTO,
  ReviewDTO,
  UpdateMemberRequest,
} from './types'

export { ApiError, getErrorMessage } from './client'
export type * from './types'

/** Filtren kan inte kombineras; prioritet: search > available > sort */
export type BookQuery =
  | { search: string }
  | { available: true }
  | { sort: 'id' | 'title' | 'author' }

function toQueryString(query?: BookQuery): string {
  if (!query) return ''
  const params = new URLSearchParams(
    Object.entries(query).map(([key, value]) => [key, String(value)]),
  )
  return `?${params}`
}

export const booksApi = {
  list: (query?: BookQuery) => get<BookDTO[]>(`/books${toQueryString(query)}`),
  get: (id: number) => get<BookDetailsDTO>(`/books/${id}`),
  mostBorrowed: (limit = 10) => get<BookStatisticsDTO[]>(`/books/most-borrowed?limit=${limit}`),
  reviews: (id: number) => get<ReviewDTO[]>(`/books/${id}/reviews`),
  addReview: (id: number, review: CreateReviewRequest) =>
    post<ReviewDTO>(`/books/${id}/reviews`, review),
}

export const membersApi = {
  list: () => get<MemberDTO[]>('/members'),
  get: (id: number) => get<MemberProfileDTO>(`/members/${id}`),
  create: (member: CreateMemberRequest) => post<MemberDTO>('/members', member),
  update: (id: number, member: UpdateMemberRequest) => put<MemberDTO>(`/members/${id}`, member),
  suspend: (id: number) => post<MemberDTO>(`/members/${id}/suspend`),
  loans: (id: number) => get<LoanDTO[]>(`/members/${id}/loans`),
  fines: (id: number) => get<FineDTO[]>(`/members/${id}/fines`),
  payFine: (id: number, fineId: number) => post<FineDTO>(`/members/${id}/fines/${fineId}/pay`),
  notifications: (id: number) => get<NotificationDTO[]>(`/members/${id}/notifications`),
}

export const loansApi = {
  /** Endast aktiva lån */
  list: () => get<LoanDTO[]>('/loans'),
  overdue: () => get<OverdueLoanDTO[]>('/loans/overdue'),
  get: (id: number) => get<LoanDTO>(`/loans/${id}`),
  /** Lånetid 14 dagar */
  create: (loan: CreateLoanRequest) => post<LoanDTO>('/loans', loan),
  /** Böter på 2 per försenad dag */
  return: (id: number) => post<LoanReturnDTO>(`/loans/${id}/return`),
  /** Ett försenat lån kan inte förlängas */
  extend: (id: number, extraDays: number) => post<LoanDTO>(`/loans/${id}/extend`, { extraDays }),
}

export const notificationsApi = {
  create: (notification: CreateNotificationRequest) =>
    post<NotificationDTO>('/notifications', notification),
  markAsRead: (id: number) => post<NotificationDTO>(`/notifications/${id}/read`),
}
