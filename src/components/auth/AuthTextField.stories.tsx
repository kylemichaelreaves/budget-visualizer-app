import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { User } from 'lucide-solid'
import { AuthTextField } from './AuthTextField'

const meta = {
  title: 'Auth/AuthTextField',
  component: AuthTextField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [(Story) => <div class="w-[380px]">{Story()}</div>],
} satisfies Meta<typeof AuthTextField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: 'at-default',
    label: 'Username',
    placeholder: 'Choose a username',
    value: '',
    onInput: () => {},
    onFocus: () => {},
    onBlur: () => {},
    focused: false,
    hasError: false,
    errorMessage: null,
    icon: User,
    testid: 'story-at',
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    id: 'at-err',
    value: '',
    hasError: true,
    errorMessage: 'Username is required.',
  },
}

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = createSignal('')
    const [focused, setFocused] = createSignal(false)
    return (
      <AuthTextField
        id="at-interactive"
        label="Username"
        placeholder="Choose a username"
        value={value()}
        onInput={setValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        focused={focused()}
        hasError={value().length > 0 && value().length < 3}
        errorMessage={value().length > 0 && value().length < 3 ? 'At least 3 characters.' : null}
        icon={User}
        testid="story-at-interactive"
      />
    )
  },
}
