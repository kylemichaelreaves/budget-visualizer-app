import type { JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { createSignal, For, onMount, Show } from 'solid-js'
import TransactionCreateForm from '@components/transactions/forms/TransactionCreateForm'
import { Button } from '@components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import { authState } from '@stores/authStore'
import { NAVBAR_APP_HEIGHT_PX } from '@components/layout/NavBar'

type MenuItem = { path: string; title: string }
type MenuSection = { label: string; items: MenuItem[] }

const menuSections: MenuSection[] = [
  {
    label: 'Budget',
    items: [
      { path: '/budget-visualizer/transactions', title: 'Transactions' },
      { path: '/budget-visualizer/transactions/pending', title: 'Pending' },
      { path: '/budget-visualizer/memos', title: 'Memos' },
      { path: '/budget-visualizer/budget-categories', title: 'Budget Categories' },
      { path: '/budget-visualizer/loan-calculator', title: 'Loan Calculator' },
    ],
  },
  {
    label: 'Genealogy',
    items: [{ path: '/budget-visualizer/genealogy', title: 'Family Tree' }],
  },
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

  /* AppLayout stacks NavBar above this section; avoid min-h-screen (100vh) or min document height
     becomes navbar + 100vh and the page scrolls even when main content is short. */
  return (
    <section
      class="bg-background text-foreground flex flex-col"
      style={{ 'min-height': `calc(100dvh - ${NAVBAR_APP_HEIGHT_PX}px)` }}
    >
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
          when={
            !loc.pathname.includes('/budget-categories') &&
            !loc.pathname.includes('/loan-calculator') &&
            !loc.pathname.includes('/genealogy') &&
            !loc.pathname.includes('/account')
          }
        >
          <header class="flex justify-end mb-6">
            <Button type="button" onClick={() => setShowCreate(true)}>
              Add New Transaction
            </Button>
          </header>
        </Show>

        <div class="flex gap-6 items-start">
          <nav class="flex flex-col gap-1 w-48 shrink-0" aria-label="Sidebar navigation">
            <For each={menuSections}>
              {(section, sectionIdx) => (
                <>
                  <h3
                    class="text-xs font-semibold tracking-wider text-muted-foreground uppercase px-3 pb-1"
                    classList={{ 'pt-3': sectionIdx() > 0 }}
                  >
                    {section.label}
                  </h3>
                  <For each={section.items}>
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
                </>
              )}
            </For>
          </nav>
          <main class="flex-1 min-w-0">{props.children}</main>
        </div>
      </div>
    </section>
  )
}
