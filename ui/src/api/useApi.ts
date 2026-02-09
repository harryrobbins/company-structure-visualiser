import type { components, paths } from './schema'
import hash from 'stable-hash'
import { type MaybeRefOrGetter, ref, toValue, watchEffect } from 'vue'
import type { VueRef } from '@/vue-extra.ts'
import createClient from 'openapi-fetch'
import { appConfig } from '@/config.ts'

export const client = createClient<paths>({ baseUrl: appConfig().basePath })

export type HTTPValidationError = components['schemas']['HTTPValidationError']

function throwError(response: Response, error?: HTTPValidationError): never {
  const detail = error?.detail
  let message = ''
  if (!detail) {
    message = `API error: ${response.status} ${response.statusText}`
  } else if (Array.isArray(detail)) {
    message = detail.map((err) => err.msg).join(', ')
  } else {
    message = `${detail}`
  }
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

function tryGetCacheSync<Result>(key: string): Result | null {
  const cachedEntry = cache.get(key)
  return cachedEntry && cachedEntry.result !== null ? (cachedEntry.result as Result) : null
}

export type UseApi<T, DataKey extends string = 'data'> = { [P in DataKey]: VueRef<T | null> } & {
  error: VueRef<string | null>
  isLoading: VueRef<boolean>
  mutate: () => void
}

function cacheKey<Path extends keyof paths, Request>(path: Path, request: MaybeRefOrGetter<Request>): string {
  return hash({ path, params: toValue(request) })
}

function mutateCache<Path extends keyof paths, Request>(path: Path, request: MaybeRefOrGetter<Request>) {
  cache.delete(cacheKey(path, request))
}

function useApi<Path extends keyof paths, Request, Response>(
  path: Path,
  request: MaybeRefOrGetter<Request>,
  fetcher: (path: Path, request: Request) => Promise<Response>,
  maxAge: number = 60000, // cache for 1 minute by default
): UseApi<Response> {
  const error = ref<string | null>(null)
  const isLoading = ref<boolean>(true)
  const data = ref<Response | null>(null)

  function mutate() {
    mutateCache(path, request)
    data.value = null
    error.value = null
  }

  watchEffect(async () => {
    const key = cacheKey(path, request)

    // check sync cache first, no need to set loading state
    const syncResult = tryGetCacheSync<Response>(key)
    if (syncResult !== null) {
      data.value = syncResult
      isLoading.value = false
      error.value = null
      return
    }

    // async fetch
    const cachedData = cacheGet(key, () => fetcher(path, toValue(request)), maxAge)
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
  })

  return { data, error, isLoading, mutate }
}
