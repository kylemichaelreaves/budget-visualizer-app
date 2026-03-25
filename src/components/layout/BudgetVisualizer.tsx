import type { JSX } from 'solid-js'
import { A, useLocation, useNavigate } from '@solidjs/router'
import { createSignal, For, onMount } from 'solid-js'
import TransactionCreateForm from '@components/transactions/TransactionCreateForm'
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
    <section
      class="budget-shell"
      style={{
        background: '#383838',
        color: '#ecf0f1',
        'min-height': '100vh',
        padding: '16px',
      }}
    >
      <header
        style={{
          display: 'flex',
          'justify-content': 'flex-end',
          'margin-bottom': '12px',
        }}
      >
        <button type="button" onClick={() => setShowCreate(true)}>
          Add New Transaction
        </button>
      </header>

      {showCreate() ? (
        <dialog
          open
          style={{
            background: '#2c2c2c',
            color: '#ecf0f1',
            border: '1px solid #555',
            padding: '20px',
            'border-radius': '8px',
            'max-width': '520px',
            width: '90vw',
          }}
        >
          <h3 style={{ 'margin-top': 0 }}>Add New Transaction</h3>
          <TransactionCreateForm onClose={() => setShowCreate(false)} />
          <button type="button" onClick={() => setShowCreate(false)} style={{ 'margin-top': '12px' }}>
            Close
          </button>
        </dialog>
      ) : null}

      <div style={{ display: 'flex', gap: '16px', 'align-items': 'flex-start' }}>
        <nav
          style={{
            display: 'flex',
            'flex-direction': 'column',
            gap: '4px',
            'min-width': '160px',
          }}
          aria-label="Budget visualizer sections"
        >
          <For each={menuItems}>
            {(item) => (
              <A
                href={item.path}
                style={{
                  padding: '10px 12px',
                  'border-radius': '6px',
                  'text-decoration': 'none',
                  color: loc.pathname === item.path ? '#1a1a1a' : '#ecf0f1',
                  background: loc.pathname === item.path ? '#5dade2' : 'transparent',
                }}
              >
                {item.title}
              </A>
            )}
          </For>
        </nav>
        <main style={{ flex: '1', 'min-width': 0, padding: 0 }}>{props.children}</main>
      </div>
    </section>
  )
}
