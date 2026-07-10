export function extractApiError(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { detail?: unknown } } }).response
    const detail = response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    if (Array.isArray(detail)) {
      const joined = detail
        .map((item: { msg?: string }) => item?.msg)
        .filter(Boolean)
        .join('; ')
      if (joined) return joined
    }
  }
  return fallback
}
