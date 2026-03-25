import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseCompanyOwnershipWorkbook } from './parse.ts'
import { exportGroupStructureToXlsx } from './export.ts'

async function file(filename: string): Promise<ArrayBuffer> {
  const bytes = await readFile(join(process.cwd(), 'sample-data', filename))
  return bytes as unknown as ArrayBuffer
}

describe('export', () => {
  it('should roundtrip: parse → edit → export → re-parse → equals edited data', async () => {
    const original = await parseCompanyOwnershipWorkbook(await file('example.xlsx'))

    const edited = {
      entities: original.entities.map((e) =>
        e.id === '12345670' ? { ...e, name: 'Google LLC' } : e,
      ),
      relationships: original.relationships.map((r) =>
        r.parent === '12345670' && r.child === '12345671' ? { ...r, percentageOwnership: 35 } : r,
      ),
    }

    const exported = await exportGroupStructureToXlsx(edited)
    const reimported = await parseCompanyOwnershipWorkbook(exported)

    expect(reimported).deep.eq(edited)
  })

  it('should preserve taxJurisdictionOfIncorporation when different from taxJurisdiction', async () => {
    const original = await parseCompanyOwnershipWorkbook(await file('example.xlsx'))

    const exported = await exportGroupStructureToXlsx(original)
    const reimported = await parseCompanyOwnershipWorkbook(exported)

    const jetbrains = reimported.entities.find((e) => e.id === '12345677')
    expect(jetbrains?.taxJurisdiction).toBe('UNITED KINGDOM')
    expect(jetbrains?.taxJurisdictionOfIncorporation).toBe('UNITED STATES')
  })

  it('should default taxJurisdictionOfIncorporation to taxJurisdiction when they match', async () => {
    const original = await parseCompanyOwnershipWorkbook(await file('example.xlsx'))

    const exported = await exportGroupStructureToXlsx(original)
    const reimported = await parseCompanyOwnershipWorkbook(exported)

    const google = reimported.entities.find((e) => e.id === '12345670')
    expect(google?.taxJurisdiction).toBe('UNITED KINGDOM')
    expect(google?.taxJurisdictionOfIncorporation).toBe('UNITED KINGDOM')
  })
})
