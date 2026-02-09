import type { Edge, Node } from '@vue-flow/core'
import * as z from 'zod/mini'

export interface NodeData {
  label: string
  entity: Entity
}

export interface EntityGraph {
  nodes: Node<NodeData>[]
  edges: Edge<{ relationship: EntityRelationship }>[]
}

export const EntityRow = z.object({
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

export function cleanUpEntity(entity: z.infer<typeof EntityRow>): Entity {
  const name = entity['Constituent Entities Resident in Tax Jurisdiction'].trim()
  const tin = entity['Constituent Entities TIN'].trim()
  const taxJurisdiction = entity['Tax Jurisdiction'].trim()
  return {
    id: tin || name,
    type: entity['Entity type'],
    name,
    tin,
    taxJurisdiction,
    taxJurisdictionOfIncorporation:
      entity['Tax Jurisdiction of Incorporation if Different from Residence']?.trim() || taxJurisdiction,
  }
}

export const RelationshipRow = z.object({
  'Parent name or TIN': z.string(),
  'Child name or TIN': z.string(),
  'Percentage Ownership': z.number().check(z.minimum(0)).check(z.maximum(100)),
})

export interface EntityRelationship {
  parent: string
  child: string
  percentageOwnership: number
}

export function cleanUpRelationship(ownership: z.infer<typeof RelationshipRow>): EntityRelationship {
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

export interface Visualization {
  id: number
  date: Date
  filename: string
  structure: GroupStructure
}

export function visualizationStatus(visualization: Visualization) {
  return 'uploaded'
}

export type VisualizationStatus = ReturnType<typeof visualizationStatus>

export function visualizationStatusTitle(status: VisualizationStatus) {
  switch (status) {
    case 'uploaded':
      return 'Uploaded'
  }
}
