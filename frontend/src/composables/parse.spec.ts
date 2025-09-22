import { describe, expect, it } from 'vitest'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { parseCompanyOwnershipWorkbook } from './parse.ts' // adjust import path as needed

function file(filename: string): Promise<Buffer> {
  return readFile(join(process.cwd(), 'sample-data', filename))
}

describe('parse', () => {
  it('should fail to parse spreadsheet with loops', async () => {
    const fileBuffer = await file('invalid-loop.xlsx')
    await expect(parseCompanyOwnershipWorkbook(fileBuffer)).rejects.toThrow('Invalid ownership: company Surprisingly Ltd (1234567) cannot own itself.')
  })

  it('should parse the spreadsheet and return a CompanyGraph', async () => {
    const fileBuffer = await file('simple.xlsx')
    const result = await parseCompanyOwnershipWorkbook(fileBuffer)

    expect(result).deep.eq({
      nodes: [
        {
          id: '1234567',
          data: {
            label: 'Surprisingly Ltd',
          },
          position: {
            x: 0,
            y: 0,
          },
          type: 'default',
        },
        {
          id: '2345678',
          data: {
            label: 'Surprisingly Limited Services LLP',
          },
          position: {
            x: 0,
            y: 0,
          },
          type: 'output',
        },
        {
          id: '345678910',
          data: {
            label: 'Surprisingly Incorporated',
          },
          position: {
            x: 0,
            y: 0,
          },
          type: 'input',
        },
      ],
      edges: [
        {
          id: '345678910->1234567',
          source: '345678910',
          target: '1234567',
          label: '100%',
          markerEnd: 'arrowclosed',
        },
        {
          id: '345678910->2345678',
          source: '345678910',
          target: '2345678',
          label: '50%',
          markerEnd: 'arrowclosed',
        },
        {
          id: '1234567->2345678',
          source: '1234567',
          target: '2345678',
          label: '50%',
          markerEnd: 'arrowclosed',
        },
      ],
    })
  })
})
