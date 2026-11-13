import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { CONFIRM_MISMATCH_ERROR, CONFIRM_REQUIRED_ERROR } from '@components/auth/createNewPasswordFields'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@utils/authRoutes'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const changePasswordMock = vi.fn<(current: string, next: string) => Promise<{ message: string }>>()
vi.mock('@api/auth/changePassword', () => ({
  changePassword: (current: string, next: string) => changePasswordMock(current, next),
}))

const { ChangePasswordForm } = await import('@components/settings/ChangePasswordForm')

const STRONG = 'Str0ng!pass'

function renderForm() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <ChangePasswordForm />
    </QueryClientProvider>
  ))
}

const current = () => screen.getByTestId<HTMLInputElement>('change-password-current-input')
const next = () => screen.getByTestId<HTMLInputElement>('change-password-new-input')
const confirm = () => screen.getByTestId<HTMLInputElement>('change-password-confirm-input')
const submit = () => fireEvent.click(screen.getByTestId('change-password-submit'))

function fill(cur: string, pw: string, cf: string) {
  fireEvent.input(current(), { target: { value: cur } })
  fireEvent.input(next(), { target: { value: pw } })
  fireEvent.input(confirm(), { target: { value: cf } })
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    resetRouterState()
    changePasswordMock.mockReset()
  })

  it('shows no validation errors before the first submit', () => {
    renderForm()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('reports every missing field on an empty submit and does not call the API', () => {
    renderForm()
    submit()
    expect(screen.getByText('Enter your current password.')).toBeInTheDocument()
    expect(screen.getByText(/at least 8 characters/)).toBeInTheDocument()
    expect(screen.getByText(CONFIRM_REQUIRED_ERROR)).toBeInTheDocument()
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('treats a whitespace-only current password as missing', () => {
    renderForm()
    fill('   ', STRONG, STRONG)
    submit()
    expect(screen.getByText('Enter your current password.')).toBeInTheDocument()
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('blocks a mismatched confirmation', () => {
    renderForm()
    fill('old-password', STRONG, `${STRONG}x`)
    submit()
    expect(screen.getByText(CONFIRM_MISMATCH_ERROR)).toBeInTheDocument()
    expect(changePasswordMock).not.toHaveBeenCalled()
  })

  it('sends the current and new password, then shows the success state', async () => {
    changePasswordMock.mockResolvedValue({ message: 'ok' })
    renderForm()
    fill('old-password', STRONG, STRONG)
    submit()
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
    expect(changePasswordMock).toHaveBeenCalledWith('old-password', STRONG)
  })

  it('"Back to app" replaces the history entry with the default authenticated route', async () => {
    changePasswordMock.mockResolvedValue({ message: 'ok' })
    renderForm()
    fill('old-password', STRONG, STRONG)
    submit()
    fireEvent.click(await screen.findByTestId('change-password-done'))
    expect(routerState.navigate).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_ROUTE, { replace: true })
  })

  it('"Change again" returns to an empty form without stale errors', async () => {
    changePasswordMock.mockResolvedValue({ message: 'ok' })
    renderForm()
    fill('old-password', STRONG, STRONG)
    submit()
    fireEvent.click(await screen.findByTestId('change-password-change-again'))

    expect(current().value).toBe('')
    expect(next().value).toBe('')
    expect(confirm().value).toBe('')
    expect(current().type).toBe('password')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows the server message on failure and clears it once the user edits a field', async () => {
    changePasswordMock.mockRejectedValue(new Error('Current password is incorrect'))
    renderForm()
    fill('wrong-password', STRONG, STRONG)
    submit()

    const alert = await screen.findByTestId('change-password-error')
    expect(alert).toHaveTextContent('Current password is incorrect')

    fireEvent.input(current(), { target: { value: 'right-password' } })
    await waitFor(() => expect(screen.queryByTestId('change-password-error')).toBeNull())
  })

  it('clears the server error when the new password is edited', async () => {
    changePasswordMock.mockRejectedValue(new Error('Password reused'))
    renderForm()
    fill('old-password', STRONG, STRONG)
    submit()
    await screen.findByTestId('change-password-error')

    fireEvent.input(next(), { target: { value: `${STRONG}2` } })
    await waitFor(() => expect(screen.queryByTestId('change-password-error')).toBeNull())
  })

  it('disables the inputs and labels the button while the request is in flight', async () => {
    let resolve!: (v: { message: string }) => void
    changePasswordMock.mockReturnValue(new Promise((r) => (resolve = r)))
    renderForm()
    fill('old-password', STRONG, STRONG)
    submit()

    expect(await screen.findByText('Updating…')).toBeInTheDocument()
    expect(screen.getByText('Verifying…')).toBeInTheDocument()
    expect(current()).toBeDisabled()
    expect(next()).toBeDisabled()
    expect(confirm()).toBeDisabled()
    expect(screen.getByTestId('change-password-submit')).toBeDisabled()

    resolve({ message: 'ok' })
    expect(await screen.findByText('Password updated')).toBeInTheDocument()
  })

  it('toggles visibility of each password field independently', () => {
    renderForm()
    const [curToggle, newToggle, cfToggle] = screen.getAllByRole('button', { name: 'Show password' })

    fireEvent.click(curToggle)
    expect(current().type).toBe('text')
    expect(next().type).toBe('password')

    fireEvent.click(newToggle)
    expect(next().type).toBe('text')

    fireEvent.click(cfToggle)
    expect(confirm().type).toBe('text')

    fireEvent.click(screen.getAllByRole('button', { name: 'Hide password' })[0])
    expect(current().type).toBe('password')
  })

  it('links to the forgot-password flow', () => {
    renderForm()
    expect(screen.getByTestId('change-password-forgot-link')).toHaveAttribute('href', '/password/reset')
  })
})
