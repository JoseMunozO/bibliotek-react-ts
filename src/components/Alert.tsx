const styles = {
  error: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  success: 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300',
}

interface Props {
  type?: keyof typeof styles
  message: string | null | undefined
}

/**
 * Aviso de error (role="alert", se anuncia enseguida) o de éxito (role="status",
 * se anuncia sin interrumpir). La región existe siempre, vacía y oculta si no hay
 * mensaje, porque los lectores de pantalla solo anuncian de forma fiable los
 * cambios en una región que ya estaba en la página.
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
