import type { Locator, Page } from '@playwright/test'

export type ObservabilityRangeId = '1h' | '24h' | '7d' | '30d'

export class ObservabilityPage {
  readonly page: Page
  readonly root: Locator
  readonly refreshButton: Locator
  readonly apiCard: Locator
  readonly lambdaTable: Locator
  readonly ingestionCard: Locator
  readonly rdsCard: Locator
  readonly error: Locator
  readonly retryButton: Locator
  readonly forbidden: Locator
  readonly loading: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('observability-page')
    this.refreshButton = page.getByTestId('observability-refresh')
    this.apiCard = page.getByTestId('observability-api-card')
    this.lambdaTable = page.getByTestId('observability-lambda-table')
    this.ingestionCard = page.getByTestId('observability-ingestion-card')
    this.rdsCard = page.getByTestId('observability-rds-card')
    this.error = page.getByTestId('observability-error')
    this.retryButton = page.getByTestId('observability-retry')
    this.forbidden = page.getByTestId('observability-forbidden')
    this.loading = page.getByTestId('observability-loading')
  }

  rangeButton(range: ObservabilityRangeId): Locator {
    return this.page.getByTestId(`observability-range-${range}`)
  }

  async goto(range?: ObservabilityRangeId) {
    await this.page.goto(`/budget-visualizer/observability${range ? `?range=${range}` : ''}`)
  }
}
