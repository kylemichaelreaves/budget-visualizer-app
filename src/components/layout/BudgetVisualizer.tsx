import type { JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { createSignal, For, onMount } from 'solid-js'
import TransactionCreateForm from '@components/transactions/TransactionCreateForm'
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
    <section class="bg-background text-foreground min-h-screen p-4">
      <header class="flex justify-end mb-3">
        <Button type="button" onClick={() => setShowCreate(true)}>
          Add New Transaction
        </Button>
      </header>

      <Dialog open={showCreate()} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionCreateForm onClose={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      <div class="flex gap-4 items-start">
        <nav
          class="flex flex-col gap-1 min-w-[160px]"
          aria-label="Budget visualizer sections"
        >
          <For each={menuItems}>
            {(item) => (
              <A
                href={item.path}
                class={
                  loc.pathname === item.path
                    ? 'px-3 py-2.5 rounded-md no-underline bg-[#5dade2] [color:#fff]'
                    : 'px-3 py-2.5 rounded-md no-underline [color:var(--foreground)] hover:bg-accent'
                }
              >
                {item.title}
              </A>
            )}
          </For>
        </nav>
        <main class="flex-1 min-w-0">{props.children}</main>
      </div>
    </section>
  )
}
