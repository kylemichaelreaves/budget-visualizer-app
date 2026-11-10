import type { Locator, Page } from '@playwright/test'

/** POM for the CSV import page at `/budget-visualizer/transactions/csv`. */
export class DataImportPage {
  readonly page: Page
  readonly root: Locator
  readonly fileInput: Locator
  readonly uploadingCard: Locator
  readonly successCard: Locator
  readonly successFilename: Locator
  readonly errorCard: Locator
  readonly errorTitle: Locator
  readonly errorBody: Locator
  readonly recentList: Locator
  readonly recentFiles: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('data-import-page')
    this.fileInput = page.getByTestId('data-import-file-input')
    this.uploadingCard = page.getByTestId('data-import-uploading-card')
    this.successCard = page.getByTestId('data-import-success-card')
    this.successFilename = page.getByTestId('success-filename')
    this.errorCard = page.getByTestId('data-import-error-card')
    this.errorTitle = page.getByTestId('data-import-error-title')
    this.errorBody = page.getByTestId('data-import-error-body')
    this.recentList = page.getByTestId('data-import-recent-list')
    this.recentFiles = page.getByTestId('data-import-recent-file')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/transactions/csv')
  }

  /** Chooses a file through the hidden input, as the picker and drop zone both end up doing. */
  async chooseFile(name: string, contents: string, mimeType = 'text/csv') {
    await this.fileInput.setInputFiles({ name, mimeType, buffer: Buffer.from(contents) })
  }
}
