import type { Request, Route } from '@playwright/test'
import { authenticatedTest as test, expect } from './fixtures/fixtures'
import { CSV_UPLOAD_ORIGIN } from './fixtures/install-api-mocks'

const CSV = 'Date,Description,Memo,Amount Debit\n01/15/2025,POS PURCHASE,WHOLEFDS,-37.31\n'

/** Stands in for S3: answers the CORS preflight and the presigned PUT. */
async function fulfillPresignedPut(route: Route) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'PUT',
    'Access-Control-Allow-Headers': 'content-type',
  }
  await route.fulfill({ status: route.request().method() === 'OPTIONS' ? 204 : 200, headers })
}

/*
 * E2E runs against the production `vite preview` build, the only place the CSP
 * meta tag exists. A wrong `CSV_UPLOAD_ORIGINS` in vite.config.ts breaks import
 * in production alone, so these tests are its only coverage.
 */
test.describe('CSV import', () => {
  test('lists recent imports grouped by month', async ({ dataImportPage }) => {
    await dataImportPage.goto()
    await expect(dataImportPage.recentFiles).toHaveText(['2025_01.csv', '2024_12.csv'])
    await expect(dataImportPage.recentList).toContainText('January 2025')
  })

  test('uploads a valid file to the presigned S3 URL', async ({ page, dataImportPage }) => {
    const puts: Request[] = []
    await page.route(`${CSV_UPLOAD_ORIGIN}/**`, async (route) => {
      if (route.request().method() === 'PUT') puts.push(route.request())
      await fulfillPresignedPut(route)
    })
    const createImport = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith('/api/v1/transactions/csv'),
    )

    await dataImportPage.goto()
    await dataImportPage.chooseFile('2025_02.csv', CSV)

    expect((await createImport).postDataJSON()).toEqual({ filename: '2025_02.csv', contentType: 'text/csv' })
    await expect(dataImportPage.successCard).toBeVisible()
    await expect(dataImportPage.successFilename).toHaveText('2025_02.csv')
    expect(puts).toHaveLength(1)
    expect(new URL(puts[0].url()).pathname).toBe('/imports/e2e-user/2025_02.csv')
    expect(await puts[0].headerValue('content-type')).toBe('text/csv')
    expect(puts[0].postData()).toBe(CSV)
  })

  test('uploads as text/csv when the browser reports text/plain', async ({ page, dataImportPage }) => {
    // resourceQuerier allows only text/csv and application/vnd.ms-excel; the
    // contract-checked mock 400s anything else, as the real handler would.
    const puts: Request[] = []
    await page.route(`${CSV_UPLOAD_ORIGIN}/**`, async (route) => {
      if (route.request().method() === 'PUT') puts.push(route.request())
      await fulfillPresignedPut(route)
    })
    const createImport = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().endsWith('/api/v1/transactions/csv'),
    )

    await dataImportPage.goto()
    await dataImportPage.chooseFile('2025_03.csv', CSV, 'text/plain')

    expect((await createImport).postDataJSON()).toEqual({ filename: '2025_03.csv', contentType: 'text/csv' })
    await expect(dataImportPage.successCard).toBeVisible()
    expect(puts).toHaveLength(1)
    expect(await puts[0].headerValue('content-type')).toBe('text/csv')
  })

  test('the CSP blocks an upload host missing from connect-src', async ({
    page,
    apiMocks,
    dataImportPage,
  }) => {
    // Proves the test above has teeth: were the real bucket dropped from
    // CSV_UPLOAD_ORIGINS, its upload would fail exactly like this one.
    const blockedOrigin = 'https://not-the-transactions-bucket.s3.us-east-1.amazonaws.com'
    apiMocks.csvUploadOrigin = blockedOrigin
    let reachedNetwork = false
    await page.route(`${blockedOrigin}/**`, async (route) => {
      reachedNetwork = true
      await fulfillPresignedPut(route)
    })
    const cspViolation = page.waitForEvent(
      'console',
      (msg) => /Content Security Policy/.test(msg.text()) && msg.text().includes(blockedOrigin),
    )

    await dataImportPage.goto()
    await dataImportPage.chooseFile('2025_02.csv', CSV)

    await cspViolation
    await expect(dataImportPage.errorTitle).toHaveText('Upload failed')
    expect(reachedNetwork).toBe(false)
  })

  test('rejects a filename the ingestion lambda cannot file, without calling the API', async ({
    page,
    dataImportPage,
  }) => {
    let created = false
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/v1/transactions/csv')) created = true
    })

    await dataImportPage.goto()
    await dataImportPage.chooseFile('bank-export.csv', CSV)

    await expect(dataImportPage.errorTitle).toHaveText("Filename doesn't match the expected pattern")
    expect(created).toBe(false)
  })

  test('rejects an uppercase .CSV extension, which resourceQuerier would 400', async ({
    page,
    dataImportPage,
  }) => {
    let created = false
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/v1/transactions/csv')) created = true
    })

    await dataImportPage.goto()
    await dataImportPage.chooseFile('2025_02.CSV', CSV)

    await expect(dataImportPage.errorTitle).toHaveText("Filename doesn't match the expected pattern")
    expect(created).toBe(false)
  })
})
