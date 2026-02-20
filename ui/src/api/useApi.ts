import type { components, paths } from './schema'
import hash from 'stable-hash'
import { type MaybeRefOrGetter, ref, toValue, watch, type WatchOptions } from 'vue'
import { deepToRaw, type VueRef } from '@/vue-extra.ts'
import createClient from 'openapi-fetch'
import { appConfig } from '@/config.ts'
import type { CompanyMatchRequest, CompanyMatchResponse } from '@/api/models.ts'

export const client = createClient<paths>({ baseUrl: appConfig().basePath })

export type HTTPValidationError = components['schemas']['HTTPValidationError']

function errorMessage(response: Response, error?: HTTPValidationError): string {
  const detail = error?.detail
  if (!detail) {
    return `API error: ${response.status} ${response.statusText}`
  } else if (Array.isArray(detail)) {
    return detail.map((err) => err.msg).join(', ')
  } else {
    return `${detail}`
  }
}

function throwError(response: Response, error?: HTTPValidationError): never {
  const message = errorMessage(response, error)
  console.error(message, response)
  throw new Error(message)
}

interface CacheEntry {
  timestamp: number
  promise: Promise<any>
  result: any | null
}
const cache = new Map<string, CacheEntry>()

async function cacheGet<Result>(key: string, factory: () => Promise<Result>, maxAge: number): Promise<any | null> {
  const cachedEntry = cache.get(key)
  if (cachedEntry && Date.now() - cachedEntry.timestamp < maxAge) {
    return cachedEntry.promise
  }

  const promise = factory().catch((e) => {
    cache.delete(key)
    throw e
  })
  const entry = { timestamp: Date.now(), promise, result: null }
  promise.then((result) => (entry.result = result as any))

  cache.set(key, entry)
  return await promise
}

function tryGetCacheSync<Result>(key: string, maxAge: number): Result | null {
  const cachedEntry = cache.get(key)
  if (!cachedEntry || cachedEntry.result === null) {
    return null
  }
  // Check if cache entry has expired
  if (Date.now() - cachedEntry.timestamp >= maxAge) {
    return null
  }
  return cachedEntry.result as Result
}

export type UseApi<T, DataKey extends string = 'data'> = { [P in DataKey]: VueRef<T | null> } & {
  error: VueRef<string | null>
  isLoading: VueRef<boolean>
  mutate: () => void
}

function cacheKey<Path extends keyof paths, Request>(path: Path, request: Request): string {
  return hash({ path, params: request })
}

function mutateCache<Path extends keyof paths, Request>(path: Path, request: Request) {
  cache.delete(cacheKey(path, request))
}

function useApi<Path extends keyof paths, Request, Response>(
  path: Path,
  requestRef: MaybeRefOrGetter<Request>,
  fetcher: (path: Path, request: Request) => Promise<Response>,
  maxAge: number = 60000, // cache for 1 minute by default
  watchOptions: WatchOptions = {},
): UseApi<Response> {
  const error = ref<string | null>(null)
  const isLoading = ref<boolean>(true)
  const data = ref<Response | null>(null)

  function mutate() {
    mutateCache(path, toValue(requestRef))
    data.value = null
    error.value = null
  }

  watch(
    () => toValue(requestRef),
    async (requestProxy) => {
      const request = deepToRaw(requestProxy)
      const key = cacheKey(path, request)

      // check sync cache first, no need to set loading state
      const syncResult = tryGetCacheSync<Response>(key, maxAge)
      if (syncResult !== null) {
        data.value = syncResult
        isLoading.value = false
        error.value = null
        return
      }

      // async fetch
      const cachedData = cacheGet(key, () => fetcher(path, request), maxAge)
      isLoading.value = true
      error.value = null
      try {
        data.value = await cachedData
      } catch (e) {
        error.value = e instanceof Error ? e.message : typeof e === 'string' ? e : 'unknown error'
        console.error(e)
      } finally {
        isLoading.value = false
      }
    },
    watchOptions,
  )

  return { data, error, isLoading, mutate }
}

export function useSearchCompanies(
  requestRef: MaybeRefOrGetter<CompanyMatchRequest>,
): UseApi<CompanyMatchResponse, 'searchResult'> {
  const { data: searchResult, ...result } = useApi(
    '/api/match-companies',
    requestRef,
    async (path, request) => {
      if (request.company_names.length === 0) {
        return { matches: {} }
      }

      const { data, response } = await client.POST(path, { body: request })
      if (!response.ok) {
        throwError(response)
      }
      return data || { matches: {} }
    },
    60000,
    { deep: true, immediate: true },
  )
  return { ...result, searchResult }
}
