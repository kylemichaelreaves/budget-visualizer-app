import type { JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { createEffect, createSignal, For, Show } from 'solid-js'
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
      { path: '/budget-visualizer/transactions/csv', title: 'CSV Imports' },
      { path: '/budget-visualizer/loan-calculator', title: 'Loan Calculator' },
    ],
  },
]

export default function BudgetVisualizer(props: { children?: JSX.Element }) {
  const loc = useLocation()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = createSignal(false)

  /**
   * Reactive, not `onMount`: a one-shot check only fires on the initial mount,
   * so losing the session while inside the app left the whole authenticated
   * shell rendered until something else happened to navigate.
   *
   * The redirect preserves the path the user actually asked for. It previously
   * hardcoded `/transactions`, so a deep link to any other page sent them
   * somewhere else after signing in.
   */
  createEffect(() => {
    if (authState.isUserAuthenticated) return
    const target = `${loc.pathname}${loc.search}`
    navigate(`/login?redirect=${encodeURIComponent(target)}`, { replace: true })
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
            !loc.pathname.includes('/account') &&
            !loc.pathname.includes('/transactions/csv')
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
          {/* Gate the child route on the session. Without this, an unauthenticated
              deep link mounted the page and fired its whole query set before the
              redirect landed — a burst of 401s, each racing the interceptor's own
              `window.location.assign` against this component's `navigate`. */}
          <main class="flex-1 min-w-0">
            <Show when={authState.isUserAuthenticated}>{props.children}</Show>
          </main>
        </div>
      </div>
    </section>
  )
}
