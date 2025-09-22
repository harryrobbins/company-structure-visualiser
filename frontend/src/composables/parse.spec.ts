import {describe, expect, it} from 'vitest'
import {readFile} from 'fs/promises'
import {join} from 'path'
import {parseCompanyOwnershipWorkbook} from './parse.ts' // adjust import path as needed

function file(filename: string): Promise<Buffer> {
  return readFile(join(process.cwd(), 'sample-data', filename))
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
          "name": "Entity name 1",
          "tin": "12345670",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        },
        {
          "id": "12345671",
          "type": "Company Hybrid",
          "name": "Entity name 2",
          "tin": "12345671",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345672",
          "type": "Partnership",
          "name": "Entity name 3",
          "tin": "12345672",
          "taxJurisdiction": "AUSTRALIA",
          "taxJurisdictionOfIncorporation": "AUSTRALIA"
        },
        {
          "id": "12345673",
          "type": "Partnership Hybrid",
          "name": "Entity name 4",
          "tin": "12345673",
          "taxJurisdiction": "NEW ZEALAND",
          "taxJurisdictionOfIncorporation": "NEW ZEALAND"
        },
        {
          "id": "12345674",
          "type": "Branch",
          "name": "Entity name 5",
          "tin": "12345674",
          "taxJurisdiction": "CHILE",
          "taxJurisdictionOfIncorporation": "CHILE"
        },
        {
          "id": "12345675",
          "type": "Trust",
          "name": "Entity name 6",
          "tin": "12345675",
          "taxJurisdiction": "BERMUDA",
          "taxJurisdictionOfIncorporation": "BERMUDA"
        },
        {
          "id": "12345676",
          "type": "Company",
          "name": "Entity name 7",
          "tin": "12345676",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        },
        {
          "id": "12345677",
          "type": "Company",
          "name": "Entity name 8",
          "tin": "12345677",
          "taxJurisdiction": "UNITED KINGDOM",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345678",
          "type": "Company",
          "name": "Entity name 9",
          "tin": "12345678",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED STATES"
        },
        {
          "id": "12345679",
          "type": "Company",
          "name": "Entity name 10",
          "tin": "12345679",
          "taxJurisdiction": "UNITED STATES",
          "taxJurisdictionOfIncorporation": "UNITED KINGDOM"
        }
      ],
      "relationships": [
        {
          "parent": "12345670",
          "child": "12345671",
          "percentageOwnership": 100
        },
        {
          "parent": "12345670",
          "child": "12345676",
          "percentageOwnership": 100
        },
        {
          "parent": "12345671",
          "child": "12345672",
          "percentageOwnership": 100
        },
        {
          "parent": "12345671",
          "child": "12345673",
          "percentageOwnership": 100
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
          "percentageOwnership": 100
        },
        {
          "parent": "12345676",
          "child": "12345677",
          "percentageOwnership": 100
        },
        {
          "parent": "12345678",
          "child": "12345679",
          "percentageOwnership": 100
        }
      ]
    })
  })
})
