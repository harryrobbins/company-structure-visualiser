declare module 'govuk-vue' {
  import { App } from 'vue'

  const GovUkVue: {
    install(app: App): void
  }
  export { GovUkVue }
  export * from 'govuk-vue/dist/src/components'
}

declare type AppConfig = {
  basePath: string
  feedbackUrl: string
  teamChatUrl: string
}

declare const __APP_CONFIG__: AppConfig
