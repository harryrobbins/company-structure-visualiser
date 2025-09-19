import { defineStore } from 'pinia'
import type { CompanyGraph } from '@/composables/useParse.ts'
import type {CompanySearchResponse} from "@/api";


export interface CompanyState {
  graph: CompanyGraph | null
  currentSearch: CompanySearchResponse[] | null
}

export const useGraphStore = defineStore('graph', {
  state: (): CompanyState => {
    return { graph: null, currentSearch: null }
  },
  actions: {
    setGraph(graph: CompanyGraph) {
      this.graph = graph
    },
    setCurrentSearch(results: CompanySearchResponse[]) {
      this.currentSearch = results
    }
  },
})
