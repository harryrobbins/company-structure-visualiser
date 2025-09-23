import type {components} from "@/api/schema";

import { client } from "./client"

export type CompanyMatch = components["schemas"]["CompanyMatch"]
export type CompanyMatchRequest = components["schemas"]["CompanyMatchRequest"]
export type CompanyMatchResponse = components["schemas"]["CompanyMatchResponse"]
export type CompanyMatchResult = components["schemas"]["CompanyMatchResult"]


export type CompanyMatchResultWithManualSelection = CompanyMatchResult & { manual_selection?: ManualSelection }
export type CompanyMatches = Record<string, CompanyMatchResultWithManualSelection>




export interface ManualSelection {
  original_selection?: string
}

export async function searchCompanies(request: CompanyMatchRequest): Promise<CompanyMatchResponse> {
  const response = await client.POST('/api/match-companies', { body: request })
  // TODO handle error
  return response.data || { matches: {} }
}
