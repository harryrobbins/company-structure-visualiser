import type {components} from "@/api/schema";

import { client } from "./client"

export type CompanyMatch = components["schemas"]["CompanyMatch"]
export type CompanySearchRequest = components["schemas"]["CompanySearchRequest"]
export type CompanySearchResponse = components["schemas"]["CompanySearchResponse"]
export type CompanySearchResponseWithManualSelected = CompanySearchResponse & { manual_selection?: ManualSelection }

export interface ManualSelection {
  original_selection?: string
}

export async function searchCompanies(requests: CompanySearchRequest[]): Promise<CompanySearchResponse[]> {
  const response = await client.POST('/api/search/companies', { body: requests })
  return response.data || []
}
