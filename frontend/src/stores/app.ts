import { defineStore } from 'pinia'
import {type CompanyGraph, parseCompanyOwnershipWorkbook} from '@/composables/parse.ts'
import {
  type CompanyMatch,
  type CompanySearchRequest,
  type CompanySearchResponse,
  searchCompanies
} from "@/api";

export interface UploadGraphState {
  type: 'upload'
}

export interface ConfirmationGraphState {
  type: 'confirmation'
  graph: CompanyGraph
  searchResults: CompanySearchResponse[]
}

export interface FailedGraphState {
  type: 'failed'
  message: string
}

export interface VisualizeGraphState {
  type: 'visualize'
  graph: CompanyGraph
}

export type GraphState = UploadGraphState | ConfirmationGraphState | VisualizeGraphState | FailedGraphState
export type GraphStateType = GraphState['type']

export interface AppState {
  graph: GraphState,
  loading: boolean
}

export type CompanyConfirmationUpdate = Record<string, CompanyMatch>

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      graph: { type: 'upload' },
      loading: false
    }
  },
  actions: {
    async upload(file: File): Promise<void> {
      if (this.graph.type !== 'upload') {
        this.graph = { type: 'failed', message: 'Invalid application state' }
        return
      }

      this.loading = true
      try {
        const data = await file.arrayBuffer()
        const graph = await parseCompanyOwnershipWorkbook(data)
        const requests: CompanySearchRequest[] = graph.nodes.map(node => {
          const data = node.data!
          return { company_name: data.label, meta: data.meta }
        })
        const searchResults = await searchCompanies(requests)
        this.graph = { type: 'confirmation', graph, searchResults }
      } catch (error) {
        this.graph = { type: 'failed', message: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        this.loading = false
      }
    },
    confirm(confirmation: CompanyConfirmationUpdate) {
      switch (this.graph.type) {
        case 'confirmation':
          this.graph = {
            type: 'visualize',
            graph: updateGraph(this.graph.graph, confirmation)
          }
          break
        case 'visualize':
          // already in visualize state, do nothing
          break
        case 'upload':
        case 'failed':
          this.graph = { type: 'failed', message: 'Invalid application state' }
          break
      }
    },
  },
})

function updateGraph(graph: CompanyGraph, updates: CompanyConfirmationUpdate): CompanyGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(node => {
      if (node.data && node.id in updates) {
        const update = updates[node.id]
        return {
          ...node,
          data: { ...node.data, label: update.CompanyName }
        }
      } else {
        return node
      }
    })
  }
}
