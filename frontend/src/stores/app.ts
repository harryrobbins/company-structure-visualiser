import { defineStore } from 'pinia'
import {type CompanyGraph, parseCompanyOwnershipWorkbook} from '@/composables/parse.ts'
import {
  type CompanyMatch,
  type CompanySearchRequest,
  type CompanySearchResponseWithManualSelected,
  searchCompanies
} from "@/api";

export interface UploadGraphState {
  type: 'upload'
}

export interface ConfirmationGraphState {
  type: 'confirmation'
  graph: CompanyGraph
  searchResults: CompanySearchResponseWithManualSelected[]
  editing: CompanySearchResponseWithManualSelected | null
}

export interface FailedGraphState {
  type: 'failed'
  message: string
}
const invalidAppState: FailedGraphState = Object.freeze({ type: 'failed', message: 'Invalid application state' })

export interface VisualizeGraphState {
  type: 'visualize'
  graph: CompanyGraph
  searchResults: CompanySearchResponseWithManualSelected[]
}

export interface AppState {
  graph: UploadGraphState | ConfirmationGraphState | VisualizeGraphState | FailedGraphState,
  loading: boolean
}

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
        this.graph = invalidAppState
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
        this.graph = { type: 'confirmation', graph, searchResults, editing: null }
      } catch (error) {
        this.graph = { type: 'failed', message: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        this.loading = false
      }
    },
    backToConfirmation() {
      if (this.graph.type === 'confirmation' && this.graph.editing) {
        this.graph.editing = null
      } else if (this.graph.type === 'visualize') {
        this.graph = { type: 'confirmation', graph: this.graph.graph, searchResults: this.graph.searchResults, editing: null }
      } else {
        this.graph = invalidAppState
      }
    },
    updateMatch(selected: CompanyMatch) {
      if (this.graph.type !== 'confirmation') {
        this.graph = invalidAppState
        return
      }

      const editing = this.graph.editing
      if (!editing) {
        this.graph = invalidAppState
        return
      }

      // Check if selected match exists in other_matches
      const selectedIndex = editing.other_matches.findIndex(match =>
        match.CompanyNumber === selected.CompanyNumber
      )
      if (selectedIndex === -1) {
        this.graph = invalidAppState
        return
      }

      // remove selected match from other_matches
      const selectedMatch = editing.other_matches.splice(selectedIndex, 1)[0]

      // Add old best_match to other_matches if it exists
      const originalSelection = editing.best_match
      if (originalSelection) {
        editing.other_matches.push(originalSelection)
      }
      editing.best_match = selectedMatch
      editing.other_matches.sort((a, b) => b.score - a.score)

      if (editing.manual_selection) {
        if (editing.manual_selection.original_selection === selected.CompanyNumber) {
          // user selected back the original selection, remove manually_selection
          delete editing.manual_selection
        }
      } else if (originalSelection) {
        editing.manual_selection = {
          original_selection: originalSelection.CompanyNumber
        }
      }

      this.graph.editing = null
    },
    confirm() {
      switch (this.graph.type) {
        case 'confirmation':
          this.graph = {
            type: 'visualize',
            graph: updatedGraph(this.graph),
            searchResults: this.graph.searchResults
          }
          break
        case 'visualize':
          // already in visualize state, do nothing
          break
        case 'upload':
        case 'failed':
          this.graph = invalidAppState
          break
      }
    },
  },
})

function updatedGraph({ graph, searchResults }: ConfirmationGraphState): CompanyGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(node => {
      if (node.data) {
        const result = searchResults.find(r => r.search_string === node.data!.search_string)
        if (!result || !result.best_match) {
          return node
        }
        return {
          ...node,
          data: { ...node.data, label: result.best_match.CompanyName }
        }
      } else {
        return node
      }
    })
  }
}
