import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Lock, AlertCircle, ShieldCheck } from 'lucide-solid'
import { AuthIconHeading } from './AuthIconHeading'

const meta = {
  title: 'Auth/AuthIconHeading',
  component: AuthIconHeading,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [(Story) => <div class="w-[380px]">{Story()}</div>],
} satisfies Meta<typeof AuthIconHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: Lock,
    title: 'Forgot your password?',
    description: 'No worries — enter your email and we\u2019ll send you a reset link.',
  },
}

export const WithError: Story = {
  args: {
    icon: Lock,
    title: 'Reset your password',
    description: 'Choose a strong new password for your account.',
    hasError: true,
  },
}

export const ErrorIcon: Story = {
  args: {
    icon: AlertCircle,
    title: 'Missing reset token',
    description: 'This page needs a ?token= parameter.',
    hasError: true,
  },
}

export const CustomIcon: Story = {
  args: {
    icon: ShieldCheck,
    title: 'Account secured',
    description: 'Your password has been updated successfully.',
  },
}
