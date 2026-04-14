import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import EquationComponent from './EquationComponent'

const meta = {
  title: 'Shared/EquationComponent',
  component: EquationComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EquationComponent>

export default meta
type Story = StoryObj<typeof meta>

export const SimpleEquation: Story = {
  args: {
    equation: 'E = mc^2',
  },
}

export const QuadraticFormula: Story = {
  args: {
    equation: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
  },
}

export const InvalidEquation: Story = {
  args: {
    equation: '\\invalid{bad}',
  },
}
