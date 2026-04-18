import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createJSXDecorator } from 'storybook-solidjs-vite'
import { Divider } from './Divider'

const meta = {
  title: 'Shared/Divider',
  component: Divider,
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
} satisfies Meta<typeof Divider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomLabel: Story = {
  args: {
    label: 'or continue with',
  },
}
