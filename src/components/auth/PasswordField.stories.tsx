import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { PasswordField } from './PasswordField'

const meta = {
  title: 'Auth/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [(Story) => <div class="w-[380px]">{Story()}</div>],
} satisfies Meta<typeof PasswordField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'pw-default',
    label: 'New password',
    placeholder: 'Create a strong password',
    value: '',
    onInput: () => {},
    onFocus: () => {},
    onBlur: () => {},
    show: false,
    onToggleShow: () => {},
    error: null,
    focused: false,
    disabled: false,
    testid: 'story-pw',
  },
}

export const Focused: Story = {
  args: {
    ...Default.args,
    id: 'pw-focused',
    focused: true,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    id: 'pw-error',
    value: 'short',
    error: 'Password is too weak \u2014 use 8+ characters with uppercase and a number.',
  },
}

export const WithSuccess: Story = {
  args: {
    ...Default.args,
    id: 'pw-success',
    label: 'Confirm password',
    value: 'Passw0rd1!',
    success: true,
  },
}

export const PasswordVisible: Story = {
  args: {
    ...Default.args,
    id: 'pw-visible',
    value: 'Passw0rd1!',
    show: true,
  },
}

export const Disabled: Story = {
  args: {
    ...Default.args,
    id: 'pw-disabled',
    value: 'Passw0rd1!',
    disabled: true,
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = createSignal('')
    const [show, setShow] = createSignal(false)
    const [focused, setFocused] = createSignal(false)
    return (
      <PasswordField
        id="pw-interactive"
        label="New password"
        placeholder="Create a strong password"
        value={value()}
        onInput={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        show={show()}
        onToggleShow={() => setShow((p) => !p)}
        error={null}
        focused={focused()}
        disabled={false}
        testid="story-pw-interactive"
      />
    )
  },
}
