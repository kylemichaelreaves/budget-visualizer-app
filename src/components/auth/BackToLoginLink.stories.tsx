import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { Router } from '@solidjs/router'
import { BackToLoginLink } from './BackToLoginLink'

const meta = {
  title: 'Auth/BackToLoginLink',
  component: BackToLoginLink,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof BackToLoginLink>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Router>
      <div class="w-[380px]">
        <BackToLoginLink />
      </div>
    </Router>
  ),
}
