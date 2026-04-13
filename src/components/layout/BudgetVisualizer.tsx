import type { JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { createSignal, For, onMount, Show } from 'solid-js'
import TransactionCreateForm from '@components/transactions/forms/TransactionCreateForm'
import { Button } from '@components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import { authState } from '@stores/authStore'

const menuItems = [
  { path: '/budget-visualizer/transactions', title: 'Transactions' },
  { path: '/budget-visualizer/transactions/pending', title: 'Pending' },
  { path: '/budget-visualizer/memos', title: 'Memos' },
  { path: '/budget-visualizer/budget-categories', title: 'Budget Categories' },
  { path: '/budget-visualizer/loan-calculator', title: 'Loan Calculator' },
]

export default function BudgetVisualizer(props: { children?: JSX.Element }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = createSignal(false)

  onMount(() => {
    if (!authState.isUserAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/budget-visualizer/transactions')}`, { replace: true })
    }
  })

  return (
    <section class="bg-background text-foreground min-h-screen">
      <Dialog open={showCreate()} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionCreateForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <div class="px-4 py-6">
        <Show
          when={!loc.pathname.includes('/budget-categories') && !loc.pathname.includes('/loan-calculator')}
        >
          <header class="flex justify-end mb-6">
            <Button type="button" onClick={() => setShowCreate(true)}>
              Add New Transaction
            </Button>
          </header>
        </Show>

        <div class="flex gap-6 items-start">
          <nav class="flex flex-col gap-1 w-48 shrink-0" aria-label="Budget visualizer sections">
            <For each={menuItems}>
              {(item) => (
                <A
                  href={item.path}
                  class={
                    loc.pathname === item.path
                      ? 'px-3 py-2.5 rounded-md no-underline bg-brand text-brand-foreground'
                      : 'px-3 py-2.5 rounded-md no-underline text-foreground hover:bg-accent'
                  }
                >
                  {item.title}
                </A>
              )}
            </For>
          </nav>
          <main class="flex-1 min-w-0">{props.children}</main>
        </div>
      </div>
    </section>
  )
}
