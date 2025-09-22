import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { GovUkVue } from 'govuk-vue'

const app = createApp(App)

app.use(createPinia())
app.use(GovUkVue)

app.mount('#app')
