import { execute } from '../db/adapter.js'

/**
 * Log an activity entry (fire-and-forget)
 */
export async function logActivity(
  actor: string,
  actionType: string,
  targetType: string,
  targetId: string | number,
  targetTitle: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await execute(
      'INSERT INTO activity_log (actor, action_type, target_type, target_id, target_title, metadata) VALUES (?, ?, ?, ?, ?, ?)',
      [actor, actionType, targetType, String(targetId), targetTitle, metadata ? JSON.stringify(metadata) : null],
    )
  } catch {
    // fire-and-forget
  }
}
