/**
 * Agent/member notification — DB-based webhook_url
 *
 * Sends notifications to the webhook_url registered in members.webhook_url.
 * Members without a webhook_url will not receive notifications.
 */

import { query } from '../db/adapter.js'

/** Look up webhook_url by display name (DB) */
export async function resolveWebhookUrl(assignee: string): Promise<string | null> {
  const result = await query<{ webhook_url: string | null }>(
    'SELECT webhook_url FROM members WHERE display_name = ? AND is_active = 1',
    [assignee],
  )
  return result.rows[0]?.webhook_url ?? null
}

/** Determine webhook format by URL pattern */
function getWebhookFormat(url: string): 'discord' | 'google' | 'slack' | 'generic' {
  if (url.includes('/api/webhooks') && (url.includes('discord.com') || url.includes('discordapp.com'))) return 'discord'
  if (url.includes('chat.googleapis.com')) return 'google'
  if (url.includes('hooks.slack.com')) return 'slack'
  return 'generic'
}

/** Send a webhook notification to a specific member (Discord/Google Chat/Slack compatible) */
export async function notifyMember(webhookUrl: string, title: string, description: string, color = 0x3B82F6): Promise<void> {
  try {
    const format = getWebhookFormat(webhookUrl)
    let body: string

    if (format === 'discord') {
      body = JSON.stringify({ embeds: [{ title, description, color }] })
    } else if (format === 'google') {
      body = JSON.stringify({ text: `*${title}*\n${description}` })
    } else if (format === 'slack') {
      body = JSON.stringify({ text: `*${title}*\n${description}` })
    } else {
      body = JSON.stringify({ title, description })
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
  } catch (_) { /* Failure should not block main logic */ }
}

/** Send notification by name (name -> DB webhook_url -> send) */
export async function notifyByName(assignee: string, title: string, description: string): Promise<boolean> {
  const url = await resolveWebhookUrl(assignee)
  if (!url) return false
  await notifyMember(url, title, description)
  return true
}

/** Send notification to multiple recipients */
export async function notifyRecipients(assignees: string[], title: string, description: string): Promise<void> {
  await Promise.all(assignees.map(a => notifyByName(a, title, description)))
}
