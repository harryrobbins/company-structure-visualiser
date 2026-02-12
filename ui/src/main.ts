import './main.css'
import './govuk.scss'
import { createApp } from 'vue'
import App from './App.vue'
import { registerLocale } from 'i18n-iso-countries'
import en from 'i18n-iso-countries/langs/en.json'
import { addIcons } from 'oh-vue-icons'
import PrimeVue from 'primevue/config'
import { type ToggleSwitchPassThroughMethodOptions } from 'primevue/toggleswitch'
import { router } from '@/router.ts'
import {
  FaSpinner,
  FaRegularArrowAltCircleUp,
  FaRegularArrowAltCircleDown,
  FaEye,
  FaTimes,
  FaRegularCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaUser,
  MdZoomin,
  MdZoomout,
  MdZoomoutmap,
} from 'oh-vue-icons/icons'

addIcons(
  FaSpinner,
  FaRegularArrowAltCircleUp,
  FaRegularArrowAltCircleDown,
  FaEye,
  FaTimes,
  FaRegularCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaUser,
  MdZoomin,
  MdZoomout,
  MdZoomoutmap,
)
registerLocale(en)

createApp(App)
  .use(router)
  .use(PrimeVue, {
    unstyled: true,
    pt: {
      autocomplete: {
        root: '',
        input: 'govuk-input',
        dropdown: 'absolute bottom-0 right-0 h-[2.5rem] p-2 cursor-pointer',
        dropdownIcon: 'h-full w-4',
        inputMultiple: '',
        overlay: 'border-2 border-t-0 bg-white z-999 overflow-y-auto',
        list: 'bg-white striped-list',
        option: 'p-1 hover:bg-blue-600! hover:text-white cursor-pointer',
        emptyMessage: 'p-2 text-gray-600',
        chipItem: 'govuk-tag govuk-tag--grey m-1 text-sm!',
      },
      popover: {
        root: 'border-2 border-gray-300 bg-white shadow-lg p-2',
        content: 'p-2',
      },
      toggleswitch: {
        root: ({ props }: ToggleSwitchPassThroughMethodOptions) => ({
          class: [
            'w-[2.75rem] h-[1.5rem] rounded-full cursor-pointer transition-colors duration-200 relative border border-transparent',
            props.disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-300',
            props.modelValue ? 'bg-blue-200' : '',
            props.invalid ? 'border-red-500' : '',
          ],
        }),
        input: 'appearance-none absolute w-full h-full cursor-pointer opacity-0 z-10',
        slider: 'absolute inset-0 rounded-full transition-colors duration-200',
        handle: ({ props }: ToggleSwitchPassThroughMethodOptions) => ({
          class: [
            'absolute top-1/2 -translate-y-1/2 w-[1.5rem] h-[1.5rem] rounded-full transition-all duration-200',
            'shadow-[0px_3px_1px_-2px_rgba(0,0,0,0.2),0px_2px_2px_0px_rgba(0,0,0,0.14),0px_1px_5px_0px_rgba(0,0,0,0.12)]',
            props.modelValue ? 'left-[calc(100%-1.5rem)] bg-blue-600' : 'left-0 bg-white',
            props.disabled ? 'bg-gray-200' : '',
          ],
        }),
      },
    },
  })
  .mount('#app')
