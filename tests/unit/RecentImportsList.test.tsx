import { render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@api/HttpError'
import { fakeQuery } from '../setup/fakeQuery'

const [imports, setImports] = fakeQuery<string[]>()
vi.mock('@api/hooks/transactions/useCsvImports', () => ({ useCsvImports: () => imports }))

const { default: RecentImportsList } = await import('@components/dataImport/RecentImportsList')

describe('RecentImportsList', () => {
  beforeEach(() => {
    setImports({ data: undefined, isPending: true, isLoading: true, isError: false, error: null })
  })

  it('shows loading, then the files grouped by month', () => {
    render(() => <RecentImportsList />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    setImports({
      isPending: false,
      isLoading: false,
      data: ['2026_04.csv', '2026_04_b.csv', '2026_03.csv'],
    })
    expect(screen.getByText('April 2026')).toBeInTheDocument()
    expect(screen.getByText('March 2026')).toBeInTheDocument()
    expect(screen.getAllByTestId('data-import-recent-file').map((el) => el.textContent)).toEqual([
      '2026_04.csv',
      '2026_04_b.csv',
      '2026_03.csv',
    ])
  })

  it('says so when there are no imports', () => {
    setImports({ isPending: false, isLoading: false, data: [] })
    render(() => <RecentImportsList />)
    expect(screen.getByText(/No imports yet/)).toBeInTheDocument()
  })

  it("shows the server's message when the list fails", () => {
    setImports({
      isPending: false,
      isLoading: false,
      isError: true,
      dataUpdatedAt: 0,
      error: new HttpError({
        method: 'GET',
        url: '/x',
        status: 500,
        data: { message: 'Bucket unavailable' },
      }),
    })
    render(() => <RecentImportsList />)
    expect(screen.getByTestId('data-import-recent-error')).toHaveTextContent('Bucket unavailable')
  })
})
