import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { AuthDivider } from './AuthDivider'

const meta = {
  title: 'Auth/AuthDivider',
  component: AuthDivider,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [(Story) => <div class="w-[380px]">{Story()}</div>],
} satisfies Meta<typeof AuthDivider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomLabel: Story = {
  args: {
    label: 'or continue with',
  },
}
