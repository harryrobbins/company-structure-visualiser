import { defineStore } from 'pinia'
import {
  type EntityGraph, entitySearchRequest,
  type GroupStructure, organisationGraph,
  parseCompanyOwnershipWorkbook
} from '@/composables/parse.ts'
import {
  type CompanyMatch,
  type CompanySearchRequest,
  type CompanySearchResponseWithManualSelected,
  searchCompanies
} from "@/api";

export interface UploadState {
  type: 'upload'
}

export interface ConfirmationState {
  type: 'confirmation'
  structure: GroupStructure
  searchResults: CompanySearchResponseWithManualSelected[]
  editing: CompanySearchResponseWithManualSelected | null
}

export interface FailedState {
  type: 'failed'
  message: string
}
const invalidAppState: FailedState = Object.freeze({ type: 'failed', message: 'Invalid application state' })

export interface VisualizeState {
  type: 'visualize'
  structure: GroupStructure
  graph: EntityGraph
  searchResults: CompanySearchResponseWithManualSelected[]
}

export interface AppState {
  state: UploadState | ConfirmationState | VisualizeState | FailedState,
  loading: boolean
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    return {
      state: { type: 'upload' },
      loading: false
    }
  },
  actions: {
    async upload(file: File): Promise<void> {
      if (this.state.type !== 'upload') {
        this.state = invalidAppState
        return
      }

      this.loading = true
      try {
        const data = await file.arrayBuffer()
        const structure = await parseCompanyOwnershipWorkbook(data)
        const requests: CompanySearchRequest[] = structure.entities.map(entitySearchRequest)
        const searchResults = await searchCompanies(requests)
        this.state = { type: 'confirmation', structure, searchResults, editing: null }
      } catch (error) {
        this.state = { type: 'failed', message: error instanceof Error ? error.message : 'Unknown error' }
      } finally {
        this.loading = false
      }
    },
    backToConfirmation() {
      if (this.state.type === 'confirmation' && this.state.editing) {
        this.state.editing = null
      } else if (this.state.type === 'visualize') {
        this.state = {
          type: 'confirmation',
          structure: this.state.structure,
          searchResults: this.state.searchResults,
          editing: null
        }
      } else {
        this.state = invalidAppState
      }
    },
    updateMatch(selected: CompanyMatch) {
      if (this.state.type !== 'confirmation') {
        this.state = invalidAppState
        return
      }

      const editing = this.state.editing
      if (!editing) {
        this.state = invalidAppState
        return
      }

      // Check if selected match exists in other_matches
      const selectedIndex = editing.other_matches.findIndex(match =>
        match.CompanyNumber === selected.CompanyNumber
      )
      if (selectedIndex === -1) {
        this.state = invalidAppState
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

      this.state.editing = null
    },
    confirm() {
      switch (this.state.type) {
        case 'confirmation':
          this.state = {
            type: 'visualize',
            structure: this.state.structure,
            searchResults: this.state.searchResults,
            graph: updatedGraph(this.state),
          }
          break
        case 'visualize':
          // already in visualize state, do nothing
          break
        case 'upload':
        case 'failed':
          this.state = invalidAppState
          break
      }
    },
  },
})

function updatedGraph({ structure, searchResults }: ConfirmationState): EntityGraph {
  const fixedEntities = structure.entities.map(entity => {
    const searchString = entitySearchRequest(entity).company_name
    const result = searchResults.find(r => r.search_string === searchString)
    return result?.best_match ? { ...entity, name: result.best_match.CompanyName } : entity;
  })

  return organisationGraph({
    entities: fixedEntities,
    relationships: structure.relationships
  })
}
