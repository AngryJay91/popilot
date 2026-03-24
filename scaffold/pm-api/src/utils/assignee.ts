import { query } from '../db/adapter.js'

/** Simple similarity score: shared characters ratio + substring containment */
export function similarity(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()
  if (al === bl) return 1
  if (al.includes(bl) || bl.includes(al)) return 0.8
  const setA = new Set(al)
  const setB = new Set(bl)
  let shared = 0
  for (const c of setA) if (setB.has(c)) shared++
  return shared / Math.max(setA.size, setB.size)
}

/** Find similar names from a list (threshold: 0.4, max 3) */
export function findSimilar(name: string, allNames: string[], threshold = 0.4): string[] {
  return allNames
    .map(n => ({ name: n, score: similarity(name, n) }))
    .filter(x => x.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(x => x.name)
}

/** Resolve display_name to member id. Returns null if not found. */
export async function resolveMemberId(displayName: string): Promise<number | null> {
  const result = await query<{ id: number }>(
    'SELECT id FROM members WHERE display_name = ? AND is_active = 1',
    [displayName],
  )
  return result.rows[0]?.id ?? null
}

/** Resolve comma-separated assignee names to comma-separated member ids (same order). Returns null for unresolved names. */
export async function resolveMemberIds(assignee: string | null | undefined): Promise<(number | null)[]> {
  if (!assignee) return []
  const names = assignee.split(',').map(s => s.trim()).filter(Boolean)
  const ids: (number | null)[] = []
  for (const name of names) {
    ids.push(await resolveMemberId(name))
  }
  return ids
}

/** Validate assignee(s) against members table. Supports comma-separated names. Suggests similar names on mismatch. */
export async function validateAssignee(assignee: string | null | undefined): Promise<string | null> {
  if (!assignee) return null
  const names = assignee.split(',').map(s => s.trim()).filter(Boolean)
  if (names.length === 0) return null

  const allMembers = await query<{ display_name: string }>(
    'SELECT display_name FROM members WHERE is_active = 1',
  )
  const allNames = allMembers.rows.map(r => r.display_name)
  const validSet = new Set(allNames)
  const invalid = names.filter(n => !validSet.has(n))

  if (invalid.length > 0) {
    const suggestions = invalid.map(name => {
      const similar = findSimilar(name, allNames)
      return similar.length
        ? `'${name}' — Did you mean: ${similar.join(', ')}?`
        : `'${name}'`
    })
    return `Invalid assignee: ${suggestions.join(' | ')}. Use list_team_members to verify`
  }
  return null
}
