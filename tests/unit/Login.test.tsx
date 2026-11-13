import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@utils/authRoutes'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

type LoginResponse = { message: string; user: unknown; token: string }
const loginRequestMock = vi.fn<(email: string, password: string) => Promise<LoginResponse>>()
const persistSessionMock = vi.fn<(user: unknown, token: string) => boolean>()
vi.mock('@stores/authStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@stores/authStore')>()),
  loginRequest: (email: string, password: string) => loginRequestMock(email, password),
  persistSession: (user: unknown, token: string) => persistSessionMock(user, token),
}))

const { default: Login } = await import('@components/auth/Login')

const ORIGIN = 'http://app.test'
const USER = { username: 'kyle', email: 'kyle@example.com', role: 'user' }

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <Login />
    </QueryClientProvider>
  ))
}

const emailInput = () => screen.getByTestId<HTMLInputElement>('login-email-input')
const pwInput = () => screen.getByTestId<HTMLInputElement>('login-password-input')
const loginButton = () => screen.getByRole('button', { name: 'Login' })

function fill(email: string, pw: string) {
  fireEvent.input(emailInput(), { target: { value: email } })
  fireEvent.input(pwInput(), { target: { value: pw } })
}

describe('Login', () => {
  let replace: ReturnType<typeof vi.fn<(url: string) => void>>

  beforeEach(() => {
    resetRouterState()
    loginRequestMock.mockReset()
    persistSessionMock.mockReset()
    replace = vi.fn<(url: string) => void>()
    vi.stubGlobal('location', { ...window.location, origin: ORIGIN, replace })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('banners from the query string', () => {
    it('shows neither banner by default', () => {
      renderLogin()
      expect(screen.queryByTestId('login-reset-success')).toBeNull()
      expect(screen.queryByTestId('login-registered-success')).toBeNull()
    })

    it('confirms a password reset', () => {
      routerState.searchParams = { resetSuccess: '1' }
      renderLogin()
      expect(screen.getByTestId('login-reset-success')).toHaveTextContent('Password updated')
    })

    it('confirms a new registration', () => {
      routerState.searchParams = { registered: '1' }
      renderLogin()
      expect(screen.getByTestId('login-registered-success')).toHaveTextContent('Account created')
    })
  })

  describe('register link', () => {
    it('is plain /register without a redirect', () => {
      renderLogin()
      expect(screen.getByTestId('login-register-link')).toHaveAttribute('href', '/register')
    })

    it('carries a safe redirect forward', () => {
      routerState.searchParams = { redirect: '/budget-visualizer/memos' }
      renderLogin()
      expect(screen.getByTestId('login-register-link')).toHaveAttribute(
        'href',
        '/register?redirect=%2Fbudget-visualizer%2Fmemos',
      )
    })

    it('drops an open redirect instead of laundering it into the link', () => {
      routerState.searchParams = { redirect: '//evil.example.com' }
      renderLogin()
      expect(screen.getByTestId('login-register-link')).toHaveAttribute('href', '/register')
    })
  })

  it('keeps the button disabled until a valid email and a password are entered', () => {
    renderLogin()
    expect(loginButton()).toBeDisabled()

    fill('not-an-email', 'secret')
    expect(screen.getByTestId('login-email-error')).toHaveTextContent(/valid email address/)
    expect(loginButton()).toBeDisabled()

    fill('kyle@example.com', '   ')
    expect(screen.queryByTestId('login-email-error')).toBeNull()
    expect(loginButton()).toBeDisabled()

    fill('kyle@example.com', 'secret')
    expect(loginButton()).toBeEnabled()
  })

  it('does not submit through the form while disabled', () => {
    renderLogin()
    fireEvent.submit(loginButton().closest('form')!)
    expect(loginRequestMock).not.toHaveBeenCalled()
  })

  it('signs in with the trimmed email and lands on the default route', async () => {
    loginRequestMock.mockResolvedValue({ message: 'ok', user: USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderLogin()
    fill('  kyle@example.com  ', 'secret')
    fireEvent.click(loginButton())

    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${ORIGIN}${DEFAULT_AUTHENTICATED_ROUTE}`))
    expect(loginRequestMock).toHaveBeenCalledWith('kyle@example.com', 'secret')
    expect(persistSessionMock).toHaveBeenCalledWith(USER, 't0k')
  })

  it('lands on a safe redirect target after signing in', async () => {
    routerState.searchParams = { redirect: '/budget-visualizer/memos?x=1' }
    loginRequestMock.mockResolvedValue({ message: 'ok', user: USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderLogin()
    fill('kyle@example.com', 'secret')
    fireEvent.click(loginButton())

    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${ORIGIN}/budget-visualizer/memos?x=1`))
  })

  it('ignores an unsafe redirect target after signing in', async () => {
    routerState.searchParams = { redirect: 'https://evil.example.com' }
    loginRequestMock.mockResolvedValue({ message: 'ok', user: USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderLogin()
    fill('kyle@example.com', 'secret')
    fireEvent.click(loginButton())

    await waitFor(() => expect(replace).toHaveBeenCalledWith(`${ORIGIN}${DEFAULT_AUTHENTICATED_ROUTE}`))
  })

  it('stays on the page with a session error when the user payload is unusable', async () => {
    loginRequestMock.mockResolvedValue({ message: 'ok', user: { nope: true }, token: 't0k' })
    persistSessionMock.mockReturnValue(false)
    renderLogin()
    fill('kyle@example.com', 'secret')
    fireEvent.click(loginButton())

    expect(await screen.findByTestId('login-session-error')).toHaveTextContent(/unreadable/)
    expect(replace).not.toHaveBeenCalled()
  })

  it('shows the server message on failure and clears it when a field is edited', async () => {
    loginRequestMock.mockRejectedValue(new Error('Invalid email or password'))
    renderLogin()
    fill('kyle@example.com', 'wrong')
    fireEvent.click(loginButton())

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid email or password')

    fireEvent.input(pwInput(), { target: { value: 'right' } })
    await waitFor(() => expect(screen.queryByTestId('login-error')).toBeNull())
  })

  it('clears the server error when the email is edited', async () => {
    loginRequestMock.mockRejectedValue(new Error('Invalid email or password'))
    renderLogin()
    fill('kyle@example.com', 'wrong')
    fireEvent.click(loginButton())
    await screen.findByTestId('login-error')

    fireEvent.input(emailInput(), { target: { value: 'other@example.com' } })
    await waitFor(() => expect(screen.queryByTestId('login-error')).toBeNull())
  })

  it('disables the form while signing in', async () => {
    loginRequestMock.mockReturnValue(new Promise(() => {}))
    renderLogin()
    fill('kyle@example.com', 'secret')
    fireEvent.click(loginButton())

    const pending = await screen.findByRole('button', { name: 'Signing in…' })
    expect(pending).toBeDisabled()
    expect(emailInput()).toBeDisabled()
    expect(pwInput()).toBeDisabled()
  })

  it('toggles password visibility', () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(pwInput().type).toBe('text')
    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(pwInput().type).toBe('password')
  })
})
