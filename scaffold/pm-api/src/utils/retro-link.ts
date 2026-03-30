/**
 * Retro → Kickoff Link — pure domain logic
 */

export interface RetroAction {
  id: number
  content: string
  assignee: string | null
  status: string
}

export interface BacklogStory {
  title: string
  description: string
  assignee: string | null
  source: string
}

/** Convert action item → backlog story */
export function actionToStory(action: RetroAction, sprintId: string): BacklogStory {
  return {
    title: `[Retro] ${action.content.slice(0, 60)}`,
    description: `Created from retro (${sprintId}) action item.\n\nOriginal: ${action.content}`,
    assignee: action.assignee,
    source: `retro:${sprintId}`,
  }
}

/** Filter incomplete action items */
export function getPendingActions(actions: RetroAction[]): RetroAction[] {
  return actions.filter(a => a.status !== 'done')
}
