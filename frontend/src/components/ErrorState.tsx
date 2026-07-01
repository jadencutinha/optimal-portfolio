interface Props {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <div className="error-state">
      <div className="state-icon">⚠</div>
      <p className="error">{message}</p>
      {onRetry && (
        <button type="button" className="signin-trigger" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}
