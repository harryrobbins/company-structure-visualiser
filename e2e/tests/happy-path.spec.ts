import { test, expect } from '@playwright/test'
import * as path from 'path'

test.describe('Happy path', () => {
  test('upload file, match companies via AI, select a match, confirm and visualize', async ({ page }) => {
    // 1. Navigate to the home page
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Visualize company structures' })).toBeVisible()

    // 2. Click the "Upload company data" start button
    await page.getByTestId('upload-company-data').click()
    await expect(page.getByRole('heading', { name: 'Company Visualizer' })).toBeVisible()

    // 3. Upload the sample file via the hidden file input
    const fileInput = page.getByTestId('file-upload')
    const sampleFilePath = path.resolve(__dirname, '../../ui/sample-data/example.xlsx')
    await fileInput.setInputFiles(sampleFilePath)

    // 4. After upload, we should be automatically navigated to the validate page
    await expect(page.getByTestId('group-structure-table')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Confirm company details' })).toBeVisible()

    // 5. Click "Check companies against Companies House database"
    await page.getByTestId('check-companies-house').click()
    await expect(page.getByRole('heading', { name: 'Match Companies' })).toBeVisible()

    // 6. Select all companies using the select all checkbox
    await page.getByTestId('select-all-checkbox').check()

    // 7. Click "Match companies" to trigger the AI matching
    await page.getByTestId('match-companies-btn').click()

    // 8. Wait for match results to appear (AI call may take a while)
    await expect(page.getByTestId('match-results')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: 'Best matches:' })).toBeVisible()

    // 9. Expand "other potential matches" on the first company card and select an alternative
    const showOtherMatchesLinks = page.getByTestId('show-other-matches')
    const firstShowLink = showOtherMatchesLinks.first()

    // Only attempt to change a match if there are other potential matches available
    if (await firstShowLink.isVisible()) {
      await firstShowLink.click()

      // Select the first alternative match
      const selectMatchButton = page.getByTestId('select-this-match').first()
      await expect(selectMatchButton).toBeVisible()
      await selectMatchButton.click()
    }

    // 10. Click "Confirm and update" to apply matches and navigate to visualization
    await page.getByTestId('confirm-and-update').click()

    // 11. Assert the visualization page is loaded and the graph is visible
    await expect(page.getByRole('heading', { name: 'Visualization' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByTestId('graph-section')).toBeVisible()

    // 12. Assert that the graph contains nodes (Vue Flow renders nodes inside the graph)
    const graphSection = page.getByTestId('graph-section')
    await expect(graphSection.locator('.vue-flow')).toBeVisible()
    await expect(graphSection.locator('.vue-flow__node').first()).toBeVisible({ timeout: 10_000 })
  })
})


