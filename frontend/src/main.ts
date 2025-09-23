import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { GovUkVue } from 'govuk-vue'
import { registerLocale } from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'

registerLocale(en)

const app = createApp(App)

app.use(createPinia())
app.use(GovUkVue)

app.mount('#app')
