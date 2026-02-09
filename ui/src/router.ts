import { createWebHistory, createRouter } from 'vue-router'

import Home from '@/routes/Home.vue'
import Upload from './routes/Upload.vue'
import Visualization from './routes/Visualization.vue'
import { appConfig } from '@/config.ts'

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'upload', path: '/upload', component: Upload },
  { name: 'visualization', path: '/visualization/:visualizationId', component: Visualization },
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' },
] as const

export type RouteName = (typeof routes)[number]['name']

export const router = createRouter({
  history: createWebHistory(appConfig().basePath),
  routes,
})
