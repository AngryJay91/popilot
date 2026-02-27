/**
 * Minimal markdown -> HTML converter (zero dependencies).
 * Handles the subset used in epic spec documents.
 */
export function renderMarkdown(md: string): string {
  const lines = md.split('\n')
  const html: string[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let inTable = false
  let inList = false
  let listType: 'ul' | 'ol' = 'ul'

  function closeList() {
    if (inList) {
      html.push(listType === 'ul' ? '</ul>' : '</ol>')
      inList = false
    }
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  function inline(s: string): string {
    s = esc(s)
    // bold
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // italic
    s = s.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // inline code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>')
    // links
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    return s
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html.push(`<pre><code>${codeLines.map(esc).join('\n')}</code></pre>`)
        codeLines = []
        inCodeBlock = false
      } else {
        closeList()
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    // Empty line
    if (line.trim() === '') {
      closeList()
      if (inTable) { inTable = false }
      continue
    }

    // Headings
    const headingMatch = line.match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      closeList()
      const level = headingMatch[1].length
      html.push(`<h${level}>${inline(headingMatch[2])}</h${level}>`)
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList()
      html.push('<hr>')
      continue
    }

    // Table
    if (line.trim().startsWith('|')) {
      // Skip separator row
      if (/^\|[\s:-]+\|/.test(line.trim()) && line.includes('-')) continue

      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1).map(c => c.trim())
      if (!inTable) {
        closeList()
        html.push('<table>')
        html.push('<thead><tr>' + cells.map(c => `<th>${inline(c)}</th>`).join('') + '</tr></thead>')
        html.push('<tbody>')
        inTable = true
      } else {
        html.push('<tr>' + cells.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>')
      }
      continue
    }
    if (inTable) {
      html.push('</tbody></table>')
      inTable = false
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList()
      html.push(`<blockquote>${inline(line.slice(2))}</blockquote>`)
      continue
    }

    // Unordered list
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/)
    if (ulMatch) {
      if (!inList || listType !== 'ul') {
        closeList()
        html.push('<ul>')
        inList = true
        listType = 'ul'
      }
      html.push(`<li>${inline(ulMatch[2])}</li>`)
      continue
    }

    // Ordered list
    const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/)
    if (olMatch) {
      if (!inList || listType !== 'ol') {
        closeList()
        html.push('<ol>')
        inList = true
        listType = 'ol'
      }
      html.push(`<li>${inline(olMatch[2])}</li>`)
      continue
    }

    // Paragraph
    closeList()
    html.push(`<p>${inline(line)}</p>`)
  }

  closeList()
  if (inTable) html.push('</tbody></table>')
  if (inCodeBlock) html.push(`<pre><code>${codeLines.map(esc).join('\n')}</code></pre>`)

  return html.join('\n')
}
