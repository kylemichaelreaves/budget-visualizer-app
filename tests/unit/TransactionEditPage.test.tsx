import { render, screen } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PendingTransaction, Transaction } from '@types'
import { routerState, resetRouterState } from '../setup/mockRouter'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const fetchTransactionMock = vi.fn<(id: number) => Promise<Transaction | PendingTransaction>>()
const fetchPendingMock = vi.fn<(id: number) => Promise<PendingTransaction>>()
vi.mock('@api/transactions/fetchTransaction', () => ({
  fetchTransaction: (id: number) => fetchTransactionMock(id),
}))
vi.mock('@api/transactions/fetchPendingTransaction', () => ({
  fetchPendingTransaction: (id: number) => fetchPendingMock(id),
}))

// The form itself is covered elsewhere; here we only care what the page hands it.
type FormProps = { transaction: Transaction; isPending: boolean; pendingTransactionId?: number }
vi.mock('@components/transactions/forms/TransactionEditForm', () => ({
  default: (props: FormProps) => (
    <div
      data-testid="form-stub"
      data-description={props.transaction.description}
      data-is-pending={String(props.isPending)}
      data-pending-id={String(props.pendingTransactionId)}
    />
  ),
}))

const { default: TransactionEditPage } = await import('@components/transactions/forms/TransactionEditPage')

const TXN: Transaction = {
  id: 42,
  date: '2026-03-01',
  description: 'POS PURCHASE',
  memo: 'WHOLEFDS',
  amount_debit: '-37.31',
  amount_credit: '',
}

function pendingRow(transaction_data: PendingTransaction['transaction_data']): PendingTransaction {
  return {
    id: 9,
    created_at: '2026-03-02T00:00:00.000Z',
    transaction_data,
    amount_debit: '-37.31',
    transaction_date: '2026-03-01',
    memo_name: 'WHOLEFDS',
    status: 'pending',
  }
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <TransactionEditPage />
    </QueryClientProvider>
  ))
}

const form = () => screen.findByTestId('form-stub')

describe('TransactionEditPage', () => {
  beforeEach(() => {
    resetRouterState()
    fetchTransactionMock.mockReset()
    fetchPendingMock.mockReset()
  })

  describe('/transactions/:transactionId', () => {
    it('fetches the transaction by id and hands it to the form', async () => {
      routerState.params = { transactionId: '42' }
      fetchTransactionMock.mockResolvedValue(TXN)
      renderPage()

      const f = await form()
      expect(f).toHaveAttribute('data-description', 'POS PURCHASE')
      expect(f).toHaveAttribute('data-is-pending', 'false')
      expect(f).toHaveAttribute('data-pending-id', 'undefined')
      expect(screen.getByRole('heading')).toHaveTextContent('Edit Transaction 42')
      expect(fetchTransactionMock).toHaveBeenCalledWith(42)
      expect(fetchPendingMock).not.toHaveBeenCalled()
    })

    it('unwraps a pending-row shaped response', async () => {
      routerState.params = { transactionId: '42' }
      fetchTransactionMock.mockResolvedValue(pendingRow(JSON.stringify(TXN)))
      renderPage()

      expect(await form()).toHaveAttribute('data-description', 'POS PURCHASE')
    })

    it('shows the loading state until the transaction arrives', () => {
      routerState.params = { transactionId: '42' }
      fetchTransactionMock.mockReturnValue(new Promise(() => {}))
      renderPage()

      expect(screen.getByTestId('transaction-edit-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('form-stub')).toBeNull()
    })

    it('shows the API error and no form when the fetch fails', async () => {
      routerState.params = { transactionId: '42' }
      fetchTransactionMock.mockRejectedValue(new Error('Transaction 42 not found'))
      renderPage()

      expect(await screen.findByTestId('transaction-edit-error-alert')).toHaveTextContent(
        'Transaction 42 not found',
      )
      expect(screen.queryByTestId('form-stub')).toBeNull()
      expect(screen.queryByTestId('transaction-not-found-alert')).toBeNull()
    })
  })

  describe('/transactions/pending/:pendingTransactionId', () => {
    it('parses transaction_data stored as a JSON string', async () => {
      routerState.params = { pendingTransactionId: '9' }
      fetchPendingMock.mockResolvedValue(pendingRow(JSON.stringify(TXN)))
      renderPage()

      const f = await form()
      expect(f).toHaveAttribute('data-description', 'POS PURCHASE')
      expect(f).toHaveAttribute('data-is-pending', 'true')
      expect(f).toHaveAttribute('data-pending-id', '9')
      expect(screen.getByRole('heading')).toHaveTextContent('Edit Pending Transaction 9')
      expect(fetchPendingMock).toHaveBeenCalledWith(9)
      expect(fetchTransactionMock).not.toHaveBeenCalled()
    })

    it('uses transaction_data stored as an object as-is', async () => {
      routerState.params = { pendingTransactionId: '9' }
      fetchPendingMock.mockResolvedValue(pendingRow({ ...TXN, description: 'FROM OBJECT' }))
      renderPage()

      expect(await form()).toHaveAttribute('data-description', 'FROM OBJECT')
    })

    it('reports not found when transaction_data is malformed JSON', async () => {
      routerState.params = { pendingTransactionId: '9' }
      fetchPendingMock.mockResolvedValue(pendingRow('{not json'))
      renderPage()

      expect(await screen.findByTestId('transaction-not-found-alert')).toBeInTheDocument()
      expect(screen.queryByTestId('form-stub')).toBeNull()
    })

    it('shows the API error from the pending fetch', async () => {
      routerState.params = { pendingTransactionId: '9' }
      fetchPendingMock.mockRejectedValue(new Error('Pending row gone'))
      renderPage()

      expect(await screen.findByTestId('transaction-edit-error-alert')).toHaveTextContent('Pending row gone')
    })
  })

  describe('invalid ids', () => {
    // `Number()` turns several of these into a positive number; none is an id.
    it.each(['abc', '0', '-2', '1.5', '1e3', ' 7', '0x10'])(
      'never fetches for transactionId %j and shows not found',
      async (raw) => {
        routerState.params = { transactionId: raw }
        renderPage()

        expect(await screen.findByTestId('transaction-not-found-alert')).toBeInTheDocument()
        expect(screen.getByRole('heading').textContent?.trim()).toBe('Edit Transaction')
        expect(fetchTransactionMock).not.toHaveBeenCalled()
        expect(fetchPendingMock).not.toHaveBeenCalled()
      },
    )

    it.each(['abc', '0', '1.5', '1e3'])('never fetches for pendingTransactionId %j', async (raw) => {
      routerState.params = { pendingTransactionId: raw }
      renderPage()

      expect(await screen.findByTestId('transaction-not-found-alert')).toBeInTheDocument()
      expect(screen.getByRole('heading').textContent?.trim()).toBe('Edit Pending Transaction')
      expect(fetchPendingMock).not.toHaveBeenCalled()
      expect(fetchTransactionMock).not.toHaveBeenCalled()
    })
  })
})
