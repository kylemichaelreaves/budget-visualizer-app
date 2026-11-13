import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { CONFIRM_MISMATCH_ERROR, CONFIRM_REQUIRED_ERROR } from '@components/auth/createNewPasswordFields'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const confirmResetMock = vi.fn<(token: string, pw: string) => Promise<{ message: string }>>()
vi.mock('@api/auth/confirmPasswordReset', () => ({
  confirmPasswordReset: (token: string, pw: string) => confirmResetMock(token, pw),
}))

const { default: ResetPasswordPage } = await import('@components/auth/ResetPasswordPage')

const STRONG = 'Str0ng!pass'

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <ResetPasswordPage />
    </QueryClientProvider>
  ))
}

const pwInput = () => screen.getByTestId<HTMLInputElement>('reset-password-new-input')
const cfInput = () => screen.getByTestId<HTMLInputElement>('reset-password-confirm-input')
const submit = () => fireEvent.click(screen.getByTestId('reset-password-submit'))

function fill(pw: string, cf: string) {
  fireEvent.input(pwInput(), { target: { value: pw } })
  fireEvent.input(cfInput(), { target: { value: cf } })
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    resetRouterState()
    confirmResetMock.mockReset()
  })

  it('asks for a new link when the URL has no token', () => {
    renderPage()
    expect(screen.getByText('Missing reset token')).toBeInTheDocument()
    expect(screen.queryByTestId('reset-password-submit')).toBeNull()
  })

  it('validates both fields on submit and does not call the API', () => {
    routerState.searchParams = { token: 'tok-123' }
    renderPage()
    submit()
    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument()
    expect(screen.getByText(CONFIRM_REQUIRED_ERROR)).toBeInTheDocument()
    expect(confirmResetMock).not.toHaveBeenCalled()
  })

  it('flags a mismatched confirmation in the field and in a summary callout', () => {
    routerState.searchParams = { token: 'tok-123' }
    renderPage()
    fill(STRONG, `${STRONG}x`)
    submit()
    expect(screen.getByText(CONFIRM_MISMATCH_ERROR)).toBeInTheDocument()
    expect(screen.getByText('Password mismatch')).toBeInTheDocument()
    expect(confirmResetMock).not.toHaveBeenCalled()
  })

  it('posts the token with the new password and sends the user to login on success', async () => {
    routerState.searchParams = { token: 'tok-123' }
    confirmResetMock.mockResolvedValue({ message: 'ok' })
    renderPage()
    fill(STRONG, STRONG)
    submit()

    expect(await screen.findByText('Password updated!')).toBeInTheDocument()
    expect(confirmResetMock).toHaveBeenCalledWith('tok-123', STRONG)

    fireEvent.click(screen.getByRole('button', { name: 'Go to login' }))
    expect(routerState.navigate).toHaveBeenCalledWith('/login?resetSuccess=1', { replace: true })
  })

  it('shows the server message on failure and clears it when the password is edited', async () => {
    routerState.searchParams = { token: 'expired' }
    confirmResetMock.mockRejectedValue(new Error('Reset link has expired'))
    renderPage()
    fill(STRONG, STRONG)
    submit()

    expect(await screen.findByTestId('reset-password-error')).toHaveTextContent('Reset link has expired')

    fireEvent.input(pwInput(), { target: { value: `${STRONG}2` } })
    await waitFor(() => expect(screen.queryByTestId('reset-password-error')).toBeNull())
  })

  it('toggles visibility of the new and confirm fields independently', () => {
    routerState.searchParams = { token: 'tok-123' }
    renderPage()
    const [pwToggle, cfToggle] = screen.getAllByRole('button', { name: 'Show password' })

    fireEvent.click(pwToggle)
    expect(pwInput().type).toBe('text')
    expect(cfInput().type).toBe('password')

    fireEvent.click(cfToggle)
    expect(cfInput().type).toBe('text')
  })
})
