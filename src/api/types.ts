// Tipos de la API de bibliotek-api. Las fechas llegan como "YYYY-MM-DD".

export type MemberStatus = 'active' | 'suspended' | 'expired'
export type MembershipType = 'standard' | 'premium' | 'basic'
export type FineStatus = 'pending' | 'paid'
// snake_case: loan_reminder, overdue_warning, account_suspended, pending_fine...
export type NotificationType = string

// Libros

export interface BookDTO {
  id: number
  title: string
  availableCopies: number
  authors: string
}

export interface BookDetailsDTO {
  id: number
  title: string
  isbn: string
  yearPublished: number
  totalCopies: number
  availableCopies: number
  summary: string
  language: string
  pageCount: number | null
  /** Separados por coma */
  authors: string
  /** Separadas por coma */
  categories: string
}

export interface BookStatisticsDTO {
  bookId: number
  title: string
  loanCount: number
}

export interface ReviewDTO {
  id: number
  bookId: number
  memberId: number
  memberName: string
  rating: number
  comment: string
  reviewDate: string
}

// Socios

export interface MemberDTO {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  membershipType: MembershipType
  status: MemberStatus
}

export interface MemberProfileDTO {
  id: number
  firstName: string
  lastName: string
  fullName: string
  email: string
  membershipDate: string
  membershipType: MembershipType
  status: MemberStatus
  activeLoansCount: number
  totalLoansCount: number
  totalFinesCount: number
  unpaidFineAmount: number
}

// Préstamos

export interface LoanDTO {
  id: number
  bookId: number
  bookTitle: string
  memberId: number
  memberName: string | null
  loanDate: string
  dueDate: string
  returnDate: string | null
}

export interface LoanReturnDTO {
  loan: LoanDTO
  /** 0 si se devolvió a tiempo */
  fineAmount: number
}

export interface OverdueLoanDTO {
  loanId: number
  bookId: number
  bookTitle: string
  memberId: number
  memberName: string
  memberEmail: string
  dueDate: string
}

export interface FineDTO {
  id: number
  loanId: number
  bookTitle: string
  amount: number
  issuedDate: string
  paidDate: string | null
  status: FineStatus
}

// Notificaciones

export interface NotificationDTO {
  id: number
  memberId: number
  loanId: number | null
  type: NotificationType
  message: string
  sentDate: string
  read: boolean
}

// Cuerpos de las peticiones

export interface CreateReviewRequest {
  memberId: number
  /** 1-5 */
  rating: number
  comment: string
}

export interface CreateMemberRequest {
  firstName: string
  lastName: string
  email: string
}

export interface UpdateMemberRequest extends CreateMemberRequest {
  membershipType: MembershipType
}

export interface CreateLoanRequest {
  memberId: number
  bookId: number
}

export interface CreateNotificationRequest {
  memberId: number
  loanId?: number
  type: NotificationType
  message: string
}

/** Forma de todas las respuestas de error del backend */
export interface ApiErrorBody {
  status: number
  message: string
}
