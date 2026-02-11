import type { EntityGraph, GroupStructure } from '@/db/models.ts'

import type { CompanyMatches } from '@/api/models.ts'

export function entityGraph({ entities, relationships }: GroupStructure, matches: CompanyMatches = {}): EntityGraph {
  return {
    nodes: entities
      .map((entity) => {
        const result = matches[entity.name]?.recommended_match
        return result ? { ...entity, name: result.CompanyName } : entity
      })
      .map((entity) => ({
        id: entity.id,
        data: { label: entity.name, entity },
        position: { x: 0, y: 0 },
        type: 'company',
      })),
    edges: relationships.map((relationship) => ({
      id: `${relationship.parent}->${relationship.child}`,
      source: relationship.parent,
      target: relationship.child,
      label: `${relationship.percentageOwnership.toFixed(0)}%`,
      markerEnd: 'arrowclosed',
      data: { relationship },
      type: 'straight',
    })),
  }
}
