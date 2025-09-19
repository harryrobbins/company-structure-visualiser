import { defineStore } from 'pinia'
import {client, type CompanySearchRequest, type CompanySearchResponse} from '@/api'

export interface SearchState {
  cache: { [companyName: string]: CompanySearchResponse },
}

export const useSearchStore = defineStore('search', {
  state: (): SearchState => {
    return {
      cache: {}
    }
  },
  actions: {
    async searchCompany(requests: CompanySearchRequest[]) {
      const results: CompanySearchResponse[] = []
      const body: CompanySearchRequest[] = []

      for (const request of requests) {
        const cached = this.cache[request.company_name]
        if (cached) {
          results.push(cached)
        } else {
          body.push(request)
        }
      }

      try {
        // Only make API call if there are uncached requests
        if (body.length > 0) {
          const response = await client.POST('/api/search/companies', { body })
          const apiResults = response.data || []
          for (const match of apiResults) {
            // Add API results to cache
            this.cache[match.search_string] = match
            results.push(match)
          }
        }
        return results
      } catch (error) {
        console.error('Search failed:', error)
        return []
      }
    }
  }
})
