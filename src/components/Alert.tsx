const styles = {
  error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
}

interface Props {
  type?: keyof typeof styles
  message: string | null | undefined
}

/**
 * Felmeddelande (role="alert", läses upp direkt) eller bekräftelse (role="status",
 * läses upp utan att avbryta). Regionen finns alltid, tom och dold om det inte finns
 * något meddelande, eftersom skärmläsare bara läser upp ändringar på ett pålitligt
 * sätt i en region som redan fanns på sidan.
 */
export default function Alert({ type = 'error', message }: Props) {
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={message ? `rounded-lg p-3 text-sm ${styles[type]}` : 'sr-only'}
    >
      {message}
    </div>
  )
}
