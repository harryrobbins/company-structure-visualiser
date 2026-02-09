import './main.css'
import './govuk.scss'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { GovUkVue } from 'govuk-vue'
import { registerLocale } from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import { addIcons } from 'oh-vue-icons'
import { router } from '@/router.ts'
import { FaSpinner, FaRegularArrowAltCircleUp, FaRegularArrowAltCircleDown, FaEye, FaTimes } from 'oh-vue-icons/icons'

addIcons(FaSpinner, FaRegularArrowAltCircleUp, FaRegularArrowAltCircleDown, FaEye, FaTimes)
registerLocale(en)

createApp(App).use(router).use(createPinia()).use(GovUkVue).mount('#app')
