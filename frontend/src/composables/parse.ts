import {Workbook, type Worksheet} from 'exceljs'
import * as z from 'zod/mini'
import type {Edge, Node} from '@vue-flow/core'
import type {CompanySearchRequest} from "@/api"

export interface NodeData {
  label: string
  entity: Entity
}

export interface EntityGraph {
  nodes: Node<NodeData>[]
  edges: Edge<{ relationship: EntityRelationship }>[]
}


const EntityRow = z.object({
  'Tax Jurisdiction': z.string(),
  'Constituent Entities Resident in Tax Jurisdiction': z.string(),
  'Constituent Entities TIN': z.coerce.string(),
  'Tax Jurisdiction of Incorporation if Different from Residence': z.optional(z.string()),
  'Entity type': z.enum(['Company', 'Company Hybrid', 'Partnership', 'Partnership Hybrid', 'Branch', 'Trust']),
})
export type EntityType = z.infer<typeof EntityRow>['Entity type']

export interface Entity {
  id: string
  type: EntityType
  name: string
  tin: string
  taxJurisdiction: string
  taxJurisdictionOfIncorporation: string
}

export function entitySearchRequest(entity: Entity): CompanySearchRequest {
  return {
    company_name: entity.name,
    meta: {
      'Entity type': entity.type,
      'Constituent Entities TIN': entity.tin,
      'Tax Jurisdiction': entity.taxJurisdiction,
      'Tax Jurisdiction of Incorporation': entity.taxJurisdictionOfIncorporation,
    },
  }
}

function cleanUpEntity(entity: z.infer<typeof EntityRow>): Entity {
  const name = entity['Constituent Entities Resident in Tax Jurisdiction'].trim()
  const tin = entity['Constituent Entities TIN'].trim()
  const taxJurisdiction = entity['Tax Jurisdiction'].trim()
  return {
    id: tin || name,
    type: entity['Entity type'],
    name,
    tin,
    taxJurisdiction,
    taxJurisdictionOfIncorporation: entity['Tax Jurisdiction of Incorporation if Different from Residence']?.trim() || taxJurisdiction,
  }
}

const RelationshipRow = z.object({
  'Parent name or TIN': z.string(),
  'Child name or TIN': z.string(),
  'Percentage Ownership': z.number().check(z.minimum(0)).check(z.maximum(100))
})

export interface EntityRelationship {
  parent: string
  child: string
  percentageOwnership: number
}

function cleanUpRelationship(ownership: z.infer<typeof RelationshipRow>): EntityRelationship {
  let percentageOwnership = ownership['Percentage Ownership']
  if (percentageOwnership <= 1) {
    percentageOwnership = percentageOwnership * 100
  }
  return {
    parent: ownership['Parent name or TIN'].trim(),
    child: ownership['Child name or TIN'].trim(),
    percentageOwnership,
  }
}

export interface GroupStructure {
  entities: Entity[]
  relationships: EntityRelationship[]
}

export function organisationGraph({ entities, relationships }: GroupStructure): EntityGraph {
  return {
    nodes: entities.map(entity => ({
      id: entity.id,
      data: {label: entity.name, entity},
      position: {x: 0, y: 0},
      type: 'company'
    })),
    edges: relationships.map((relationship) => ({
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

export async function parseCompanyOwnershipWorkbook(data: ArrayBuffer): Promise<GroupStructure> {
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(data)
  } catch (e) {
    console.error(e)
    throw new Error('Failed to read Excel file. Ensure it is a valid .xlsx file.')
  }

  const entitySheet = workbook.getWorksheet('Entities') || workbook.worksheets[0]
  if (!entitySheet) {
    throw new Error('Workbook does not contain an entity worksheet.')
  }
  const entities = toJson(workbook.worksheets[0], EntityRow).map(cleanUpEntity)

  const relationshipSheet = workbook.getWorksheet('Relationships') || workbook.worksheets[1]
  if (!relationshipSheet) {
    throw new Error('Workbook does not contain a relationship worksheet.')
  }

  function findEntity(nameOrTIN: string): Entity {
    const entity = entities.find(entity => entity.tin === nameOrTIN || entity.name === nameOrTIN)
    if (!entity) {
      throw new Error(`Entity not found: ${nameOrTIN}`)
    }
    return entity
  }

  const relationships = toJson(workbook.worksheets[1], RelationshipRow)
    .map(cleanUpRelationship)
    .map(relationship => {
      // normalize to use entity IDs
      relationship.parent = findEntity(relationship.parent).id
      relationship.child = findEntity(relationship.child).id
      if (relationship.parent === relationship.child) {
        throw new Error(`Invalid relationship: entity ${relationship.parent} cannot own itself.`)
      }
      return relationship
    })

  return { entities, relationships }
}

function toJson<Z extends z.ZodMiniObject, T = z.infer<Z>>(sheet: Worksheet, schema: Z): T[] {
  if (sheet.rowCount <= 1) return []

  // find table header
  let headerRowNumber = 0
  const allHeaders = new Set(Object.keys(schema.shape))
  sheet.eachRow((row, rowNumber) => {
    if (headerRowNumber > 0) return // already found
    const firstCell = row.getCell(1).value?.toString()?.trim()
    if (firstCell && allHeaders.has(firstCell)) {
      headerRowNumber = rowNumber
    }
  })

  const headerRow = sheet.getRow(headerRowNumber).values as string[]
  const result: T[] = []

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRowNumber) return // skip header row
    const rowData: Partial<T> = {}
    row.eachCell((cell, colNumber) => {
      const header = headerRow[colNumber] as keyof T
      rowData[header] = (cell.result ?? cell.value) as T[keyof T]
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
