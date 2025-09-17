// /e2e/tests/upload.spec.js
import { test, expect } from '@playwright/test';
import path from 'path';

// The URL of your Vite development server
const DEV_URL = 'http://localhost:5174';

// Path to your sample data file
const sampleFilePath = path.join(__dirname, '../../backend/sample_data/sample company ownership.xlsx');

test.describe('Company Visualizer E2E Test', () => {
  test('should load the page, upload a file, and render a graph', async ({ page }) => {
    // 1. Navigate to the development server URL
    await page.goto(DEV_URL);

    // 2. Wait for the main app container and verify the title
    await page.waitForSelector('#app');
    await expect(page).toHaveTitle(/Company Visualizer/);

    // 3. Find the file input element and upload the sample file
    // We use setInputFiles to simulate a user selecting a file.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText('Upload XLSX').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(sampleFilePath);

    // 4. Verify that the graph has been rendered
    // We check for a Vue Flow node element, which confirms the graph is displayed.
    // The selector looks for any element with a data-id attribute,
    // which Vue Flow uses to identify nodes.
    const graphNode = page.locator('.vue-flow__node').first();

    // Wait for the node to be visible and expect it to exist.
    await expect(graphNode).toBeVisible({ timeout: 10000 }); // Increase timeout for parsing
    console.log('Graph node found! Test successful.');
  });
});
