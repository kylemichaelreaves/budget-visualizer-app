import { createSignal } from 'solid-js'
import { createJSXDecorator } from 'storybook-solidjs-vite'
import { PasswordField } from './PasswordField'

/** @type {import('storybook-solidjs-vite').Meta<typeof PasswordField>} */
const meta = {
  title: 'Auth/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    createJSXDecorator((Story) => (
      <div class="w-[380px]">
        <Story />
      </div>
    )),
  ],
}

export default meta

const defaultArgs = {
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
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Default = {
  args: defaultArgs,
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Focused = {
  args: {
    ...defaultArgs,
    id: 'pw-focused',
    focused: true,
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const WithError = {
  args: {
    ...defaultArgs,
    id: 'pw-error',
    value: 'short',
    error: 'Password is too weak \u2014 use 8+ characters with uppercase and a number.',
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const WithSuccess = {
  args: {
    ...defaultArgs,
    id: 'pw-success',
    label: 'Confirm password',
    value: 'Passw0rd1!',
    success: true,
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const PasswordVisible = {
  args: {
    ...defaultArgs,
    id: 'pw-visible',
    value: 'Passw0rd1!',
    show: true,
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Disabled = {
  args: {
    ...defaultArgs,
    id: 'pw-disabled',
    value: 'Passw0rd1!',
    disabled: true,
  },
}

/** @type {import('storybook-solidjs-vite').StoryObj<typeof meta>} */
export const Interactive = {
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
