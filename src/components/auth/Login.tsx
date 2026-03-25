import { useNavigate, useSearchParams } from '@solidjs/router'
import { createMemo, createSignal } from 'solid-js'
import { useMutation } from '@tanstack/solid-query'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { loginRequest, persistSession } from '@stores/authStore'
import { safeRedirectPath } from '@utils/safeRedirectPath'
import { devConsole } from '@utils/devConsole'
import AlertComponent from '@components/shared/AlertComponent'

const DEFAULT_AUTHENTICATED_ROUTE = '/budget-visualizer/transactions'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [username, setUsername] = createSignal('')
  const [password, setPassword] = createSignal('')

  const redirectTarget = createMemo(
    () => safeRedirectPath(searchParams.redirect) ?? DEFAULT_AUTHENTICATED_ROUTE,
  )

  const loginMut = useMutation(() => ({
    mutationKey: ['login'],
    mutationFn: async () => loginRequest(username(), password()),
    onSuccess: (data) => {
      devConsole('log', 'Login successful', data)
      persistSession(data.user, data.token)
      navigate(redirectTarget(), { replace: true })
    },
  }))

  const isDisabled = () => loginMut.isPending || !username().trim() || !password().trim()

  const errorDescription = createMemo(() => {
    if (!loginMut.isError || !loginMut.error) return ''
    return extractApiErrorMessage(loginMut.error)
  })

  return (
    <div
      style={{
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'center',
        'align-items': 'center',
        gap: '16px',
        'min-height': '100vh',
        background: '#1e1e1e',
        color: '#ecf0f1',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: 'min(100%, 420px)',
          padding: '28px',
          background: '#2c2c2c',
          'border-radius': '10px',
          border: '1px solid #444',
        }}
      >
        {loginMut.isError ? (
          <AlertComponent type="error" title="Login failed" message={errorDescription()} />
        ) : null}
        <h1 style={{ 'margin-top': 0, 'font-size': '1.35rem' }}>Sign in</h1>
        <form
          style={{ display: 'flex', 'flex-direction': 'column', gap: '14px' }}
          onSubmit={(e) => {
            e.preventDefault()
            loginMut.mutate()
          }}
        >
          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <span style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>Username</span>
            <input
              autocomplete="username"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              style={{
                padding: '10px',
                'border-radius': '6px',
                border: '1px solid #555',
                background: '#1a1a1a',
                color: '#ecf0f1',
              }}
            />
          </label>
          <label style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <span style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>Password</span>
            <input
              type="password"
              autocomplete="current-password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (!isDisabled()) loginMut.mutate()
                }
              }}
              style={{
                padding: '10px',
                'border-radius': '6px',
                border: '1px solid #555',
                background: '#1a1a1a',
                color: '#ecf0f1',
              }}
            />
          </label>
          <button type="submit" disabled={isDisabled()}>
            {loginMut.isPending ? 'Signing in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
