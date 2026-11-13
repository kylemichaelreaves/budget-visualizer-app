import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateUserInput } from '@types'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { CONFIRM_MISMATCH_ERROR, CONFIRM_REQUIRED_ERROR } from '@components/auth/createNewPasswordFields'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@utils/authRoutes'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const createUserMock = vi.fn<(user: CreateUserInput) => Promise<unknown>>()
vi.mock('@api/users/createUser', () => ({
  createUser: (user: CreateUserInput) => createUserMock(user),
}))

const persistSessionMock = vi.fn<(user: unknown, token: string) => boolean>()
vi.mock('@stores/authStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@stores/authStore')>()),
  persistSession: (user: unknown, token: string) => persistSessionMock(user, token),
}))

const { default: CreateUserPage } = await import('@components/auth/CreateUserPage')

const STRONG = 'Str0ng!pass'
const API_USER = { id: 3, username: 'kyle', email: 'kyle@example.com', role: 'user' }

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <CreateUserPage />
    </QueryClientProvider>
  ))
}

const usernameInput = () => screen.getByTestId<HTMLInputElement>('register-username-input')
const emailInput = () => screen.getByTestId<HTMLInputElement>('register-email-input')
const pwInput = () => screen.getByTestId<HTMLInputElement>('register-password-input')
const cfInput = () => screen.getByTestId<HTMLInputElement>('register-confirm-input')
const submit = () => fireEvent.click(screen.getByTestId('register-submit'))

function fill(username: string, email: string, pw: string, cf = pw) {
  fireEvent.input(usernameInput(), { target: { value: username } })
  fireEvent.input(emailInput(), { target: { value: email } })
  fireEvent.input(pwInput(), { target: { value: pw } })
  fireEvent.input(cfInput(), { target: { value: cf } })
}

describe('CreateUserPage', () => {
  beforeEach(() => {
    resetRouterState()
    createUserMock.mockReset()
    persistSessionMock.mockReset()
  })

  it('reports every missing field on an empty submit and does not call the API', () => {
    renderPage()
    submit()
    expect(screen.getByText('Username is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument()
    expect(screen.getByText(CONFIRM_REQUIRED_ERROR)).toBeInTheDocument()
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('rejects a malformed email', () => {
    renderPage()
    fill('kyle', 'kyle@', STRONG)
    submit()
    expect(screen.getByTestId('register-email-error')).toHaveTextContent(/valid email address/)
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('rejects a mismatched confirmation', () => {
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG, `${STRONG}x`)
    submit()
    expect(screen.getByText(CONFIRM_MISMATCH_ERROR)).toBeInTheDocument()
    expect(createUserMock).not.toHaveBeenCalled()
  })

  it('sends trimmed username and email with the password', async () => {
    createUserMock.mockResolvedValue({ user: API_USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderPage()
    fill('  kyle  ', '  kyle@example.com ', STRONG)
    submit()

    await waitFor(() => expect(createUserMock).toHaveBeenCalled())
    expect(createUserMock).toHaveBeenCalledWith({
      username: 'kyle',
      email: 'kyle@example.com',
      password: STRONG,
    })
  })

  it('signs straight in and lands on the default route when the API returns a session', async () => {
    createUserMock.mockResolvedValue({ user: API_USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE, { replace: true }),
    )
    // The user was normalized before it reached persistSession.
    expect(persistSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'kyle', email: 'kyle@example.com' }),
      't0k',
    )
  })

  it('lands on a safe redirect when the API returns a session', async () => {
    routerState.searchParams = { redirect: '/budget-visualizer/memos' }
    createUserMock.mockResolvedValue({ user: API_USER, token: 't0k' })
    persistSessionMock.mockReturnValue(true)
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenCalledWith('/budget-visualizer/memos', { replace: true }),
    )
  })

  it('sends the user to sign in, keeping a safe redirect, when the API returns no session', async () => {
    routerState.searchParams = { redirect: '/budget-visualizer/memos' }
    createUserMock.mockResolvedValue({ message: 'created' })
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenCalledWith(
        '/login?registered=1&redirect=%2Fbudget-visualizer%2Fmemos',
        { replace: true },
      ),
    )
    expect(persistSessionMock).not.toHaveBeenCalled()
  })

  it('falls back to sign in, dropping an unsafe redirect, when the session cannot be persisted', async () => {
    routerState.searchParams = { redirect: '//evil.example.com' }
    createUserMock.mockResolvedValue({ user: API_USER, token: 't0k' })
    persistSessionMock.mockReturnValue(false)
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    await waitFor(() =>
      expect(routerState.navigate).toHaveBeenCalledWith('/login?registered=1', { replace: true }),
    )
  })

  it('shows the server message on failure and clears it when a field is edited', async () => {
    createUserMock.mockRejectedValue(new Error('Username already taken'))
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    expect(await screen.findByTestId('register-error')).toHaveTextContent('Username already taken')

    fireEvent.input(usernameInput(), { target: { value: 'kyle2' } })
    await waitFor(() => expect(screen.queryByTestId('register-error')).toBeNull())
  })

  it('disables submit while the account is being created', async () => {
    createUserMock.mockReturnValue(new Promise(() => {}))
    renderPage()
    fill('kyle', 'kyle@example.com', STRONG)
    submit()

    expect(await screen.findByText('Creating account…')).toBeInTheDocument()
    expect(screen.getByTestId('register-submit')).toBeDisabled()
  })

  it('toggles visibility of the password and confirm fields independently', () => {
    renderPage()
    const [pwToggle, cfToggle] = screen.getAllByRole('button', { name: 'Show password' })

    fireEvent.click(pwToggle)
    expect(pwInput().type).toBe('text')
    expect(cfInput().type).toBe('password')

    fireEvent.click(cfToggle)
    expect(cfInput().type).toBe('text')
  })

  it('links to sign in, carrying only a safe redirect', () => {
    routerState.searchParams = { redirect: '/budget-visualizer/memos' }
    renderPage()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Fbudget-visualizer%2Fmemos',
    )
  })
})
