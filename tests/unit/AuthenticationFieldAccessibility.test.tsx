import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import { User } from '@lucide/solid'
import { PasswordField } from '@components/auth/PasswordField'
import { AuthTextField } from '@components/auth/AuthTextField'
import { NewPasswordWithStrength } from '@components/auth/NewPasswordWithStrength'
import { analyzePassword } from '@components/auth/passwordStrength'

const passwordProps = {
  id: 'password',
  label: 'Password',
  placeholder: 'Enter password',
  value: '',
  onInput: () => {},
  onFocus: () => {},
  onBlur: () => {},
  show: false,
  onToggleShow: () => {},
  error: 'Password is invalid',
  focused: false,
  disabled: false,
  testid: 'password-input',
}

describe('authentication field descriptions', () => {
  it('associates PasswordField errors with the input', () => {
    render(() => <PasswordField {...passwordProps} />)
    const input = screen.getByTestId('password-input')
    const error = screen.getByRole('alert')
    expect(input).toHaveAttribute('aria-describedby', 'password-error')
    expect(error).toHaveAttribute('id', 'password-error')
  })

  it('associates AuthTextField errors with the input', () => {
    render(() => (
      <AuthTextField
        id="username"
        label="Username"
        placeholder="Enter username"
        value=""
        onInput={() => {}}
        onFocus={() => {}}
        onBlur={() => {}}
        focused={false}
        hasError
        errorMessage="Username is required"
        icon={User}
      />
    ))
    const input = screen.getByRole('textbox', { name: 'Username' })
    const error = screen.getByRole('alert')
    expect(input).toHaveAttribute('aria-describedby', 'username-error')
    expect(error).toHaveAttribute('id', 'username-error')
  })

  it('associates password errors and visible strength requirements with the password input', () => {
    render(() => (
      <NewPasswordWithStrength
        {...passwordProps}
        id="new-password"
        testid="new-password-input"
        strength={analyzePassword('weak')}
        showRequirements
      />
    ))
    const input = screen.getByTestId('new-password-input')
    expect(input.getAttribute('aria-describedby')?.split(' ')).toEqual([
      'new-password-error',
      'new-password-requirements',
    ])
    expect(document.getElementById('new-password-requirements')).toBeInTheDocument()
  })
})
