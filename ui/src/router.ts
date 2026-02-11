import { createWebHistory, createRouter } from 'vue-router'

import Home from '@/routes/Home.vue'
import Upload from './routes/Upload.vue'
import Validate from './routes/Validate.vue'
import Visualize from './routes/Visualize.vue'
import Match from './routes/Match.vue'
import { appConfig } from '@/config.ts'

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'upload', path: '/upload', component: Upload },
  { name: 'validate', path: '/upload/:uploadId/validate', component: Validate },
  { name: 'match', path: '/upload/:uploadId/match', component: Match },
  { name: 'visualize', path: '/upload/:uploadId/visualize', component: Visualize },
  { path: '/:pathMatch(.*)*', name: 'not-found', redirect: '/' },
] as const

export type RouteName = (typeof routes)[number]['name']

export const router = createRouter({
  history: createWebHistory(appConfig().basePath),
  routes,
})
