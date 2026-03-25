import { Workbook } from 'exceljs'
import type { Entity, GroupStructure } from '@/db/models.ts'

export async function exportGroupStructureToXlsx(structure: GroupStructure): Promise<ArrayBuffer> {
  const workbook = new Workbook()

  const entitySheet = workbook.addWorksheet('Entities')
  entitySheet.addRow([
    'Tax Jurisdiction',
    'Constituent Entities Resident in Tax Jurisdiction',
    'Constituent Entities TIN',
    'Tax Jurisdiction of Incorporation if Different from Residence',
    'Entity type',
  ])
  for (const entity of structure.entities) {
    entitySheet.addRow([
      entity.taxJurisdiction,
      entity.name,
      entity.tin,
      entity.taxJurisdictionOfIncorporation !== entity.taxJurisdiction
        ? entity.taxJurisdictionOfIncorporation
        : undefined,
      entity.type,
    ])
  }

  const relationshipSheet = workbook.addWorksheet('Relationships')
  relationshipSheet.addRow(['Parent name or TIN', 'Child name or TIN', 'Percentage Ownership'])

  function entityById(id: string): Entity {
    const entity = structure.entities.find((e) => e.id === id)
    if (!entity) throw new Error(`Entity not found: ${id}`)
    return entity
  }

  for (const rel of structure.relationships) {
    const parent = entityById(rel.parent)
    const child = entityById(rel.child)
    relationshipSheet.addRow([
      parent.tin || parent.name,
      child.tin || child.name,
      rel.percentageOwnership,
    ])
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as unknown as ArrayBuffer
}

export function downloadXlsx(buffer: ArrayBuffer, filename: string): void {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
