import Dexie, { type EntityTable, liveQuery, type Subscription } from 'dexie'
import { isRef, type MaybeRefOrGetter, onScopeDispose, ref, toValue, watch } from 'vue'
import type { VueRef } from '@/vue-extra.ts'
import type { Visualization } from '@/db/models.ts'

export const db = new Dexie('company_structure_v1') as Dexie & {
  visualizations: EntityTable<Visualization, 'id'>
}

db.version(1).stores({
  visualizations: '++id',
})

export type UseDb<Result> = {
  result: VueRef<Result | null>
  isLoading: VueRef<boolean>
  error: VueRef<string | null>
}

export function useDb<Result, Args extends object>(
  args: MaybeRefOrGetter<Args>,
  fetcher: (args: Args) => Promise<Result>,
): UseDb<Result> {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<Result | null>(null)

  let subscription: Subscription | null = null

  function createSubscription() {
    subscription?.unsubscribe()

    const observable = liveQuery(async () => {
      error.value = null
      isLoading.value = true
      try {
        result.value = await fetcher(toValue(args))
      } catch (e) {
        error.value = e instanceof Error ? e.message : String(e)
        console.error(e)
      } finally {
        isLoading.value = false
      }
    })

    subscription = observable.subscribe()
  }

  if (isRef(args) || typeof args === 'function') {
    watch(args, createSubscription, { immediate: true })
  } else {
    createSubscription()
  }

  onScopeDispose(() => subscription?.unsubscribe())

  return { result, isLoading, error }
}
