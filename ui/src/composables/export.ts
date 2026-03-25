import { Workbook, type Cell, type Row } from 'exceljs'
import type { Entity, GroupStructure } from '@/db/models.ts'

// Styles matching example.xlsx
const FONT_BASE = { bold: true, size: 11, color: { argb: 'FF000000' }, name: 'Calibri', family: 2 } as const
const FILL_HEADER = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB4C6E7' } } as const
const FILL_DATA = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } } as const
const BORDER_WHITE_THICK = { style: 'thick', color: { argb: 'FFFFFFFF' } } as const

function styleMetaCell(cell: Cell, align: 'left' | 'center') {
  cell.font = { ...FONT_BASE }
  cell.fill = { ...FILL_HEADER }
  cell.alignment = { horizontal: align, vertical: 'middle' }
}

function styleHeaderCell(cell: Cell, align: 'left' | 'right' | 'center') {
  cell.font = { ...FONT_BASE }
  cell.fill = { ...FILL_HEADER }
  cell.alignment = { horizontal: align, vertical: 'middle' }
}

function styleDataRow(row: Row, numCols: number) {
  for (let c = 1; c <= numCols; c++) {
    const cell = row.getCell(c)
    cell.font = { ...FONT_BASE }
    cell.fill = { ...FILL_DATA }
    cell.border = {
      left: BORDER_WHITE_THICK,
      right: BORDER_WHITE_THICK,
      top: BORDER_WHITE_THICK,
      bottom: BORDER_WHITE_THICK,
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  }
}

function addMetaRow(sheet: ReturnType<Workbook['addWorksheet']>, label: string, value: string | Date) {
  const row = sheet.addRow([label, value, null, null, null])
  styleMetaCell(row.getCell(1), 'left')
  styleMetaCell(row.getCell(2), 'left')
  styleMetaCell(row.getCell(3), 'center')
  styleMetaCell(row.getCell(4), 'center')
  styleMetaCell(row.getCell(5), 'center')
  return row
}

export async function exportGroupStructureToXlsx(structure: GroupStructure): Promise<ArrayBuffer> {
  const workbook = new Workbook()

  // ── Entities sheet ──────────────────────────────────────────────────────────
  const entitySheet = workbook.addWorksheet('Entities')
  entitySheet.columns = [
    { width: 23.66 },
    { width: 27.83 },
    { width: 23.66 },
    { width: 23.66 },
    { width: 23.66 },
  ]

  // Metadata rows 1–3
  addMetaRow(entitySheet, 'Name of Group:', structure.groupName ?? '')
  addMetaRow(entitySheet, 'Ultimate Parent Entity:', structure.ultimateParentEntity ?? '')
  const dateRow = addMetaRow(entitySheet, 'Date', new Date())
  dateRow.getCell(2).numFmt = 'yyyy-mm-dd'

  // Header row (row 4)
  const entityHeaderRow = entitySheet.addRow([
    'Tax Jurisdiction',
    'Constituent Entities Resident in Tax Jurisdiction',
    'Constituent Entities TIN',
    'Tax Jurisdiction of Incorporation if Different from Residence',
    'Entity type',
  ])
  styleHeaderCell(entityHeaderRow.getCell(1), 'right')
  styleHeaderCell(entityHeaderRow.getCell(2), 'left')
  styleHeaderCell(entityHeaderRow.getCell(3), 'center')
  styleHeaderCell(entityHeaderRow.getCell(4), 'center')
  styleHeaderCell(entityHeaderRow.getCell(5), 'center')

  // Data rows
  for (const entity of structure.entities) {
    const row = entitySheet.addRow([
      entity.taxJurisdiction,
      entity.name,
      entity.tin,
      entity.taxJurisdictionOfIncorporation !== entity.taxJurisdiction
        ? entity.taxJurisdictionOfIncorporation
        : undefined,
      entity.type,
    ])
    styleDataRow(row, 5)
  }

  // ── Relationships sheet ─────────────────────────────────────────────────────
  const relationshipSheet = workbook.addWorksheet('Relationships')
  relationshipSheet.columns = [{ width: 15.5 }, { width: 14.5 }, { width: 18.16 }]

  relationshipSheet.addRow(['Parent name or TIN', 'Child name or TIN', 'Percentage Ownership'])

  function entityById(id: string): Entity {
    const entity = structure.entities.find((e) => e.id === id)
    if (!entity) throw new Error(`Entity not found: ${id}`)
    return entity
  }

  for (const rel of structure.relationships) {
    const parent = entityById(rel.parent)
    const child = entityById(rel.child)
    relationshipSheet.addRow([parent.tin || parent.name, child.tin || child.name, rel.percentageOwnership])
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
