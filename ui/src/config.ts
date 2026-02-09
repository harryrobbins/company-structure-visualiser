function readConfig(dynamicWindowProperty: string, compileTimeProperty: keyof AppConfig): string {
  if (dynamicWindowProperty in window) {
    const value = window[dynamicWindowProperty as any]
    if (typeof value === 'string') {
      return value
    }
  }
  return __APP_CONFIG__[compileTimeProperty]
}

export function appConfig(): AppConfig {
  return {
    basePath: readConfig('DYNAMIC_BASE_PATH', 'basePath'),
    feedbackUrl: readConfig('DYNAMIC_FEEDBACK_URL', 'feedbackUrl'),
    teamChatUrl: readConfig('DYNAMIC_TEAMS_CHAT_URL', 'teamChatUrl'),
  }
}
