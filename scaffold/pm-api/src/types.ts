export type AppEnv = {
  Bindings: {
    TURSO_URL: string
    TURSO_AUTH_TOKEN: string
    NUDGE_WEBHOOK_URL?: string
    ALLOWED_ORIGINS?: string
  }
  Variables: {
    userName: string
  }
}
