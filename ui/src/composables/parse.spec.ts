import {describe, expect, it} from 'vitest'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {parseCompanyOwnershipWorkbook} from './parse.ts' // adjust import path as needed

function file(filename: string): Promise<ArrayBuffer> {
  return readFile(join(process.cwd(), 'sample-data', filename)).then((buf) =>
    // slice the underlying ArrayBuffer to the Buffer's view to get an ArrayBuffer
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  )
}

describe('parse', () => {
  it('should fail to parse spreadsheet with loops', async () => {
    const fileBuffer = await file('invalid-loop.xlsx')
    await expect(parseCompanyOwnershipWorkbook(fileBuffer)).rejects.toThrow('Invalid relationship: entity 12345679 cannot own itself.')
  })

  it('should parse the spreadsheet and return a CompanyGraph', async () => {
    const fileBuffer = await file('example.xlsx')
    const result = await parseCompanyOwnershipWorkbook(fileBuffer)

    console.log(JSON.stringify(result, null, 2))

    expect(result).deep.eq({
      "entities": [
        {
          "id": "12345670",
          "type": "Company",
          "name": "Google",
          "tin": "12345670",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        },
        {
          "id": "12345671",
          "type": "Company Hybrid",
          "name": "Amazon",
          "tin": "12345671",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345672",
          "type": "Partnership",
          "name": "Microsoft",
          "tin": "12345672",
          "taxJurisdiction": "AUSTRALIA",
          "taxJurisdictionOfIncorporation": "AUSTRALIA"
        },
        {
          "id": "12345673",
          "type": "Partnership Hybrid",
          "name": "Facebook",
          "tin": "12345673",
          "taxJurisdiction": "NEW ZEALAND",
          "taxJurisdictionOfIncorporation": "NEW ZEALAND"
        },
        {
          "id": "12345674",
          "type": "Branch",
          "name": "Anthropic",
          "tin": "12345674",
          "taxJurisdiction": "CHILE",
          "taxJurisdictionOfIncorporation": "CHILE"
        },
        {
          "id": "12345675",
          "type": "Trust",
          "name": "OpenAI",
          "tin": "12345675",
          "taxJurisdiction": "BERMUDA",
          "taxJurisdictionOfIncorporation": "BERMUDA"
        },
        {
          "id": "12345676",
          "type": "Company",
          "name": "Deepmind",
          "tin": "12345676",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        },
        {
          "id": "12345677",
          "type": "Company",
          "name": "JetBrains",
          "tin": "12345677",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345678",
          "type": "Company",
          "name": "Github",
          "tin": "12345678",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345679",
          "type": "Company",
          "name": "Apple",
          "tin": "12345679",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        }
      ],
      "relationships": [
        {
          "parent": "12345670",
          "child": "12345671",
          "percentageOwnership": 20
        },
        {
          "parent": "12345670",
          "child": "12345676",
          "percentageOwnership": 40
        },
        {
          "parent": "12345671",
          "child": "12345672",
          "percentageOwnership": 60
        },
        {
          "parent": "12345671",
          "child": "12345673",
          "percentageOwnership": 80
        },
        {
          "parent": "12345671",
          "child": "12345674",
          "percentageOwnership": 100
        },
        {
          "parent": "12345671",
          "child": "12345678",
          "percentageOwnership": 100
        },
        {
          "parent": "12345674",
          "child": "12345675",
          "percentageOwnership": 25
        },
        {
          "parent": "12345676",
          "child": "12345677",
          "percentageOwnership": 55.00000000000001
        },
        {
          "parent": "12345678",
          "child": "12345679",
          "percentageOwnership": 99
        }
      ]
    })
  })
})
