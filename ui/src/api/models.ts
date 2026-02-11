import type { components } from '@/api/schema'

export type CompanyMatch = components['schemas']['CompanyMatch']
export type CompanyMatchRequest = components['schemas']['CompanyMatchRequest']
export type CompanyMatchResponse = components['schemas']['CompanyMatchResponse']
export type CompanyMatchResult = components['schemas']['CompanyMatchResult']
export type CompanyMatchResultWithManualSelection = CompanyMatchResult & { manual_selection?: ManualSelection }
export type CompanyMatches = Record<string, CompanyMatchResultWithManualSelection>

export interface ManualSelection {
  original_selection?: string
}
