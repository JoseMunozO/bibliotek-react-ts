import { queryOptions, useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { getErrorMessage } from './client'
import { booksApi, loansApi, membersApi, notificationsApi, type BookQuery } from './index'
import type { CreateMemberRequest, CreateReviewRequest, UpdateMemberRequest } from './types'

// Nycklarna är hierarkiska: ['members', 3] ogiltigförklarar också ['members', 3, 'loans'] osv.
export const keys = {
  books: ['books'] as const,
  bookList: (query?: BookQuery) => ['books', 'list', query ?? {}] as const,
  book: (id: number) => ['books', id] as const,
  reviews: (id: number) => ['books', id, 'reviews'] as const,
  mostBorrowed: (limit: number) => ['books', 'most-borrowed', limit] as const,
  members: ['members'] as const,
  memberList: ['members', 'list'] as const,
  member: (id: number) => ['members', id] as const,
  memberLoans: (id: number) => ['members', id, 'loans'] as const,
  memberFines: (id: number) => ['members', id, 'fines'] as const,
  notifications: (id: number) => ['members', id, 'notifications'] as const,
  loans: ['loans'] as const,
  activeLoans: ['loans', 'active'] as const,
  overdueLoans: ['loans', 'overdue'] as const,
}

export const bookQueries = {
  list: (query?: BookQuery) => queryOptions({ queryKey: keys.bookList(query), queryFn: () => booksApi.list(query) }),
  get: (id: number) => queryOptions({ queryKey: keys.book(id), queryFn: () => booksApi.get(id) }),
  reviews: (id: number) => queryOptions({ queryKey: keys.reviews(id), queryFn: () => booksApi.reviews(id) }),
  mostBorrowed: (limit: number) =>
    queryOptions({ queryKey: keys.mostBorrowed(limit), queryFn: () => booksApi.mostBorrowed(limit) }),
}

export const memberQueries = {
  list: () => queryOptions({ queryKey: keys.memberList, queryFn: membersApi.list }),
  get: (id: number) => queryOptions({ queryKey: keys.member(id), queryFn: () => membersApi.get(id) }),
  loans: (id: number) => queryOptions({ queryKey: keys.memberLoans(id), queryFn: () => membersApi.loans(id) }),
  fines: (id: number) => queryOptions({ queryKey: keys.memberFines(id), queryFn: () => membersApi.fines(id) }),
  notifications: (id: number) =>
    queryOptions({ queryKey: keys.notifications(id), queryFn: () => membersApi.notifications(id) }),
}

export const loanQueries = {
  active: () => queryOptions({ queryKey: keys.activeLoans, queryFn: loansApi.list }),
  overdue: () => queryOptions({ queryKey: keys.overdueLoans, queryFn: loansApi.overdue }),
}

/** Meddelandet för det första felet som finns, eller null */
export function firstError(...errors: unknown[]): string | null {
  const error = errors.find((e) => e != null)
  return error === undefined ? null : getErrorMessage(error)
}

/**
 * Mutation som efteråt laddar om allt som kan ha ändrats, även när den misslyckas: ett fel
 * som 409 betyder ofta att det som visas är inaktuellt. Den väntar på omladdningen, så när
 * mutateAsync löser sig visar vyerna redan de nya uppgifterna.
 */
function useMutationWithInvalidation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidates: (variables: TVariables) => QueryKey[],
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSettled: (_data, _error, variables) =>
      Promise.all(invalidates(variables).map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })
}

// Ett lån ändrar lediga exemplar och statistik (books), medlemmens lån, böter och siffror (members)
const loanChanges = () => [keys.loans, keys.books, keys.members]

export const useCreateLoan = () => useMutationWithInvalidation(loansApi.create, loanChanges)

export const useReturnLoan = () => useMutationWithInvalidation((id: number) => loansApi.return(id), loanChanges)

export const useExtendLoan = () =>
  useMutationWithInvalidation(
    ({ id, days }: { id: number; days: number }) => loansApi.extend(id, days),
    () => [keys.loans, keys.members],
  )

export const useCreateMember = () =>
  useMutationWithInvalidation((member: CreateMemberRequest) => membersApi.create(member), () => [keys.members])

// Namnet syns också i lånelistan
export const useUpdateMember = (id: number) =>
  useMutationWithInvalidation(
    (member: UpdateMemberRequest) => membersApi.update(id, member),
    () => [keys.members, keys.loans],
  )

export const useSuspendMember = (id: number) =>
  useMutationWithInvalidation(() => membersApi.suspend(id), () => [keys.members])

export const usePayFine = (memberId: number) =>
  useMutationWithInvalidation((fineId: number) => membersApi.payFine(memberId, fineId), () => [keys.member(memberId)])

export const useAddReview = (bookId: number) =>
  useMutationWithInvalidation(
    (review: CreateReviewRequest) => booksApi.addReview(bookId, review),
    () => [keys.reviews(bookId)],
  )

export const useCreateNotification = (memberId: number) =>
  useMutationWithInvalidation(notificationsApi.create, () => [keys.notifications(memberId)])

export const useMarkNotificationsAsRead = (memberId: number) =>
  useMutationWithInvalidation(
    (ids: number[]) => Promise.all(ids.map((id) => notificationsApi.markAsRead(id))),
    () => [keys.notifications(memberId)],
  )
