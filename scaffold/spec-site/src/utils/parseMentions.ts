/**
 * @pageName mentions → clickable links
 * XSS-safe: text is escaped first, then only known page names are linked.
 *
 * Page mentions are empty by default — register your project's pages
 * by editing the PAGE_MENTIONS array below.
 */

const PAGE_MENTIONS: { label: string; path: string }[] = [
  // TODO: Add your project's page mentions
  // { label: 'Home', path: '/home' },
  // { label: 'Board', path: '/board' },
  // { label: 'Standup', path: '/standup' },
  // { label: 'Retro', path: '/retro' },
]

// Match longest labels first
const SORTED_LABELS = [...PAGE_MENTIONS].sort((a, b) => b.label.length - a.label.length)

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Convert @pageName and @person mentions to clickable HTML.
 * Returns an HTML string (use with v-html).
 */
export function parseMentions(text: string): string {
  let html = escapeHtml(text)

  for (const { label, path } of SORTED_LABELS) {
    const escaped = escapeHtml(label)
    const regex = new RegExp(`@${escaped}`, 'g')
    html = html.replace(
      regex,
      `<a href="${path}" class="memo-mention" data-mention-page="${path}">@${escaped}</a>`,
    )
  }

  // Person mentions — unmatched @name rendered as blue chip
  html = html.replace(/@([^@\s&lt;][^@\n]*?)(?=\s|$|&lt;|@)/g, (match, name) => {
    if (match.includes('class="memo-mention"')) return match
    return `<span class="mention-chip">@${name}</span>`
  })

  return html
}

/** Check if text contains any page mentions */
export function hasMentions(text: string): boolean {
  return SORTED_LABELS.some(({ label }) => text.includes(`@${label}`))
}
