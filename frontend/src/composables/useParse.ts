import { Workbook, type Worksheet } from 'exceljs'
import * as z from 'zod/mini'
import type { Edge, Node } from '@vue-flow/core'
import {useSearchStore} from "@/stores/search.ts";
import {useGraphStore} from "@/stores/graph.ts";
import type {CompanySearchRequest} from "@/api";

export function useParse() {
  const searchStore = useSearchStore()
  const graphStore = useGraphStore()

  async function parseFile(data: ArrayBuffer) {
    const graph = await parseCompanyOwnershipWorkbook(data)
    const requests = graph.nodes.map(node => node.data!.searchRequest)
    const searchResults = await searchStore.searchCompany(requests)
    graphStore.setGraph(graph)
    graphStore.setCurrentSearch(searchResults)
  }

  function resetParse() {
    graphStore.$reset()
  }

  return { parseFile, resetParse }
}

export interface CompanyGraph {
  nodes: Node<{ label: string, searchRequest: CompanySearchRequest }>[]
  edges: Edge[]
}

const CompanyRow = z.object({
  'Company Number': z.coerce.string(),
  'Company Name': z.string()
})

const OwnershipRow = z.object({
  'Owner': z.string(),
  'Owns': z.string(),
  'Percentage Ownership': z.number().check(z.minimum(0)).check(z.maximum(100))
})

export async function parseCompanyOwnershipWorkbook(data: ArrayBuffer): Promise<CompanyGraph> {
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(data)
  } catch (e) {
    console.error(e)
    throw new Error('Failed to read Excel file. Ensure it is a valid .xlsx file.')
  }

  const companiesSheet = workbook.getWorksheet('Companies');
  const ownershipSheet = workbook.getWorksheet('Ownership');

  if (!companiesSheet || !ownershipSheet) {
    throw new Error('Spreadsheet must contain "Companies" and "Ownership" sheets.')
  }

  const result: CompanyGraph = { nodes: [], edges: [] }

  const companies = toJson(companiesSheet, CompanyRow)
  for (const company of companies) {
    result.nodes.push({
      id: company['Company Number'],
      data: {
        label: company['Company Name'],
        searchRequest: {
          company_name: company['Company Name'],
          meta: {} // TODO: add metadata like jurisdiction, incorporation date, etc.
        } as CompanySearchRequest,

      },
      position: { x: 0, y: 0 }
    })
  }

  function findCompanyNumberByName(name: string): string {
    const companyNumber =  companies.find(c => c['Company Name'] === name)?.['Company Number']
    if (!companyNumber) {
      throw new Error(`Company not found: ${name}`)
    }
    return companyNumber
  }

  const ownerships = toJson(ownershipSheet, OwnershipRow)
  result.edges = ownerships.map((ownership) => {
    const target = findCompanyNumberByName(ownership.Owns)
    const source = findCompanyNumberByName(ownership.Owner)

    if (source === target) {
      throw new Error(`Invalid ownership: company ${ownership.Owner} (${source}) cannot own itself.`)
    }

    return {
      id: `${source}->${target}`,
      source,
      target,
      label: `${ownership['Percentage Ownership']}%`,
      markerEnd: 'arrowclosed',
    }
  })

  // Set node types based on their role in the graph
  for (const node of result.nodes) {
    const isSource = result.edges.some(edge => edge.source === node.id)
    const isTarget = result.edges.some(edge => edge.target === node.id)

    if (isSource && !isTarget) {
      node.type = 'input'
    } else if (!isSource && isTarget) {
      node.type = 'output'
    } else {
      node.type = 'default'
    }
  }

  return result
}

function toJson<Z extends z.ZodMiniObject, T = z.infer<Z>>(sheet: Worksheet, schema: Z): T[] {
  if (sheet.rowCount <= 1) return []
  const headerRow = sheet.getRow(1).values as string[]
  const result: T[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // skip header row
    const rowData: Partial<T> = {}
    row.eachCell((cell, colNumber) => {
      const header = headerRow[colNumber] as keyof T
      rowData[header] = cell.value as T[keyof T]
    })

    const { data, error, success } = schema.safeParse(rowData)
    if (success) {
      result.push(data as T)
    } else {
      const flatten = z.flattenError(error)
      const fieldErrors = Object.entries(flatten.fieldErrors).map(([field, messages]) => `${field}=${messages?.join(', ')}`).join('; ')
      throw new Error(`Validation error in row ${rowNumber} of ${sheet.name} worksheet: ${fieldErrors}`)
    }
  })

  return result
}
