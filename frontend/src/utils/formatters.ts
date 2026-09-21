/**
 * Format a number to Indian Rupee (INR) currency display: e.g. ₹1,250.00
 */
export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00'
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string (YYYY-MM-DD or ISO) to standard readable format: e.g. "08 Sep 2026"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Format a date-time string to readable format with time: e.g. "08 Sep 2026, 06:45 PM"
 */
export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return '—'
  const date = new Date(dateTimeString)
  if (isNaN(date.getTime())) return dateTimeString
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}
