import { Lock, AlertCircle, ShieldCheck } from 'lucide-solid'
import { createJSXDecorator } from 'storybook-solidjs-vite'
import { IconHeading } from './IconHeading'

const meta = {
  title: 'Shared/IconHeading',
  component: IconHeading,
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

export const Default = {
  args: {
    icon: Lock,
    title: 'Forgot your password?',
    description: 'No worries — enter your email and we\u2019ll send you a reset link.',
  },
}

export const WithError = {
  args: {
    icon: Lock,
    title: 'Reset your password',
    description: 'Choose a strong new password for your account.',
    hasError: true,
  },
}

export const ErrorIcon = {
  args: {
    icon: AlertCircle,
    title: 'Missing reset token',
    description: 'This page needs a ?token= parameter.',
    hasError: true,
  },
}

export const CustomIcon = {
  args: {
    icon: ShieldCheck,
    title: 'Account secured',
    description: 'Your password has been updated successfully.',
  },
}
