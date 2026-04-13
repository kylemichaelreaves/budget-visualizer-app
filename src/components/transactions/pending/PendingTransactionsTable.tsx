import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import TransactionEditForm from '@components/transactions/forms/TransactionEditForm'
import TransactionsTablePagination from '@components/transactions/table/TransactionsTablePagination'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { PendingTransactionCell } from './PendingTransactionsTableCells'
import { transactionColumns } from './pendingTransactionsTableUtils'
import { usePendingTransactionsTable } from './usePendingTransactionsTable'

export default function PendingTransactionsTable(): JSX.Element {
  const state = usePendingTransactionsTable()

  return (
    <>
      <Show when={state.query.isError && state.query.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name || 'Error'}
            message={(err() as Error).message || 'Failed to load pending transactions'}
            dataTestId="pending-transactions-table-error-alert"
          />
        )}
      </Show>

      <header class="flex justify-between items-center mb-3">
        <h2 class="m-0 text-foreground">Pending Transactions</h2>
        <div role="tablist" data-testid="view-mode-segmented" class="flex gap-1">
          <Button
            variant={state.viewMode() === 'pending' ? 'default' : 'outline'}
            size="sm"
            type="button"
            onClick={() => state.setViewMode('pending')}
          >
            <Badge variant={state.viewMode() === 'pending' ? 'default' : 'secondary'}>Pending</Badge>
          </Button>
          <Button
            variant={state.viewMode() === 'reviewed' ? 'default' : 'outline'}
            size="sm"
            type="button"
            onClick={() => state.setViewMode('reviewed')}
          >
            <Badge variant={state.viewMode() === 'reviewed' ? 'default' : 'secondary'}>Reviewed</Badge>
          </Button>
        </div>
      </header>

      {state.modalOpen() && state.editTxn() ? (
        <dialog open class="border border-input p-4 bg-card text-foreground w-[min(90vw,640px)]">
          <TransactionEditForm
            transaction={state.editTxn()!}
            isPending
            pendingTransactionId={state.pendingId()}
            onClose={state.closeModal}
          />
        </dialog>
      ) : null}

      <div onContextMenu={(e) => e.preventDefault()}>
        <Show when={state.isLoadingCondition()}>
          <TableSkeleton
            columns={transactionColumns.map((c) => ({ prop: c.prop, label: c.label }))}
            rows={state.LIMIT()}
            dataTestId="pending-transactions-table-skeleton"
          />
        </Show>
        <Show when={!state.isLoadingCondition()}>
          <table
            data-testid="pending-transactions-table"
            class="w-full border-collapse text-foreground text-sm"
          >
            <thead>
              <tr>
                <For each={transactionColumns}>
                  {(col) => <th class="border border-input p-1.5">{col.label}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={state.paginatedData()}>
                {(row) => (
                  <tr onContextMenu={() => state.openModal(row)}>
                    <For each={transactionColumns}>
                      {(col) => (
                        <td class="border border-border p-1.5" data-testid={`column-${col.prop}`}>
                          <PendingTransactionCell row={row} prop={col.prop} />
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </Show>
      </div>

      <Show when={!state.isPaginationDisabled()}>
        <TransactionsTablePagination status={state.viewMode()} />
      </Show>
    </>
  )
}
