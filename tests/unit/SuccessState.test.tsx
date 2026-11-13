import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@utils/authRoutes'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const { default: SuccessState } = await import('@components/dataImport/SuccessState')

describe('SuccessState', () => {
  beforeEach(() => {
    resetRouterState()
  })

  it('names the uploaded file', () => {
    render(() => <SuccessState filename="chase-2026-03.csv" onImportAnother={() => {}} />)
    expect(screen.getByTestId('success-filename')).toHaveTextContent('chase-2026-03.csv')
  })

  it('"View transactions" goes to the default authenticated route', () => {
    render(() => <SuccessState filename="a.csv" onImportAnother={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /view transactions/i }))
    expect(routerState.navigate).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('"Import another file" hands control back without navigating', () => {
    const onImportAnother = vi.fn()
    render(() => <SuccessState filename="a.csv" onImportAnother={onImportAnother} />)
    fireEvent.click(screen.getByTestId('data-import-another-button'))
    expect(onImportAnother).toHaveBeenCalledOnce()
    expect(routerState.navigate).not.toHaveBeenCalled()
  })
})
