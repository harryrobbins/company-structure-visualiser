import { parseCompanyOwnershipWorkbook } from '@/composables/parse.ts'
import { db, type UseDb, useDb } from '@/db/useDb.ts'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'
import { useRouter } from 'vue-router'
import type { Visualization } from '@/db/models.ts'

export function useStartVisualization() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const router = useRouter()

  async function start(file: File) {
    isLoading.value = true
    error.value = null
    try {
      const data = await file.arrayBuffer()
      const structure = await parseCompanyOwnershipWorkbook(data)
      const visualizationId = await db.visualizations.add({ structure, filename: file.name, date: new Date() })
      await router.push({ name: 'visualization', params: { visualizationId } })
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }
  return { start, isLoading, error }
}

export function useVisualization(id: MaybeRefOrGetter<number | null>): UseDb<Visualization | null> {
  return useDb(
    () => ({ id: toValue(id) }),
    async ({ id }) => {
      if (!id) return null
      const visualization = await db.visualizations.get(id)
      return visualization || null
    },
  )
}

function orderVisualizations(a: Visualization, b: Visualization) {
  return b.date.getTime() - a.date.getTime()
}

export function useVisualizations(): UseDb<Visualization[]> {
  return useDb({}, async () =>
    db.visualizations.toArray().then((visualizations) => visualizations.sort(orderVisualizations)),
  )
}

export function useDeleteVisualization() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function deleteVisualization(id: number) {
    isLoading.value = true
    error.value = null
    try {
      await db.visualizations.delete(id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      console.error(e)
    } finally {
      isLoading.value = false
    }
  }

  return { deleteVisualization, isLoading, error }
}
