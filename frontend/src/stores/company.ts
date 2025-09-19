import { defineStore } from 'pinia'
import type { CompanyGraph } from '@/components/parse.ts'


export interface CompanyState {
  graph: CompanyGraph | null
}

export const useCompanyStore = defineStore('company', {
  state: (): CompanyState => {
    return { graph: null }
  },
  actions: {
    addGraph(graph: CompanyGraph) {
      this.graph = graph
    },
  },
})
