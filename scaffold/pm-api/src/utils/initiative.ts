/**
 * Initiative — pure domain logic
 */

export type InitiativeStatus = 'pending' | 'approved' | 'rejected' | 'deferred'

export const VALID_TRANSITIONS: Record<InitiativeStatus, InitiativeStatus[]> = {
  pending: ['approved', 'rejected', 'deferred'],
  approved: [],
  rejected: ['pending'],
  deferred: ['pending'],
}

export function canTransition(from: InitiativeStatus, to: InitiativeStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function validateCreate(title: string | undefined, content: string | undefined, author: string | undefined): string | null {
  if (!title?.trim()) return 'title required'
  if (!content?.trim()) return 'content required'
  if (!author?.trim()) return 'author required'
  return null
}
