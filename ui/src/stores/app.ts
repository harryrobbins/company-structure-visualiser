import { defineStore } from 'pinia'
import {
  type EntityGraph,
  type GroupStructure,
  parseCompanyOwnershipWorkbook
} from '@/composables/parse.ts'
import {
  type CompanyMatch,
  type CompanyMatches,
  searchCompanies
} from "@/api";

export interface UploadState {
  type: 'upload'
}

export interface ConfirmationState {
  type: 'confirmation'
  structure: GroupStructure
  matches: CompanyMatches
  editing: string | null
}

export interface FailedState {
  type: 'failed'
  message: string
}
const invalidAppState: FailedState = Object.freeze({ type: 'failed', message: 'Invalid application state' })

export interface VisualizeState {
  type: 'visualize'
  graph: EntityGraph
  structure: GroupStructure
  matches: CompanyMatches
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
        const searchResults = await searchCompanies({
          company_names: structure.entities.map(entity => entity.name)
        })
        this.state = { type: 'confirmation', structure, matches: searchResults.matches, editing: null }
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
          matches: this.state.matches,
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

      if (this.state.editing === null || !(this.state.editing in this.state.matches)) {
        this.state = invalidAppState
        return
      }
      const editing = this.state.matches[this.state.editing]
      if (!editing) {
        this.state = invalidAppState
        return
      }
        // Check if selected match exists in other_matches
        const selectedIndex = editing.other_matches.findIndex(
          (match) => match.CompanyName === selected.CompanyName,
        )
      if (selectedIndex === -1) {
        this.state = invalidAppState
        return
      }

      // remove selected match from other_matches
      const selectedMatch = editing.other_matches.splice(selectedIndex, 1)[0]

      // Add old best_match to other_matches if it exists
      const originalSelection = editing.recommended_match
      if (originalSelection) {
        editing.other_matches.push(originalSelection)
      }
      editing.recommended_match = selectedMatch
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
            matches: this.state.matches,
            graph: generateGraph(this.state),
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

function generateGraph({ structure, matches }: ConfirmationState): EntityGraph {
  return {
    nodes: structure.entities
      .map(entity => {
        const result = matches[entity.name]?.recommended_match
        return result ? { ...entity, name: result.CompanyName } : entity;
      })
      .map(entity => ({
        id: entity.id,
        data: {label: entity.name, entity},
        position: {x: 0, y: 0},
        type: 'company'
      })),
    edges: structure.relationships.map((relationship) => ({
      id: `${relationship.parent}->${relationship.child}`,
      source: relationship.parent,
      target: relationship.child,
      label: `${relationship.percentageOwnership.toFixed(0)}%`,
      markerEnd: 'arrowclosed',
      data: {relationship},
      type: 'straight',
    }))
  }
}
