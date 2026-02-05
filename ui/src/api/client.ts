import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { basePath } from '@/config.ts'

export const client = createClient<paths>({ baseUrl: basePath() })
