/**
 * Timezone-aware date/time helpers.
 * Default timezone can be configured via VITE_TIMEZONE env var.
 */

const DEFAULT_TZ = (import.meta.env.VITE_TIMEZONE as string) || Intl.DateTimeFormat().resolvedOptions().timeZone

/** YYYY-MM-DD in the configured timezone */
export function toDateString(date: Date = new Date(), tz: string = DEFAULT_TZ): string {
  return date.toLocaleDateString('en-CA', { timeZone: tz })
}

/** YYYY-MM-DD HH:mm in the configured timezone */
export function toDateTimeString(date: Date = new Date(), tz: string = DEFAULT_TZ): string {
  const d = date.toLocaleDateString('en-CA', { timeZone: tz })
  const t = date.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false })
  return `${d} ${t}`
}
