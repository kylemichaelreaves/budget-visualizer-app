import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import LoanCalculator from './LoanCalculator'

const meta = {
  title: 'Loan/LoanCalculator',
  component: LoanCalculator,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof LoanCalculator>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
