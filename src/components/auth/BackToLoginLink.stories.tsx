import MemoryRouterShell from '@mocks/MemoryRouterShell'
import { BackToLoginLink } from './BackToLoginLink'

/** @type {import('storybook-solidjs-vite').Meta<typeof BackToLoginLink>} */
const meta = {
  title: 'Auth/BackToLoginLink',
  component: BackToLoginLink,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'centered',
  },
}

export default meta

/**
 * Router links need router context; use MemoryRouterShell like other auth stories.
 * @type {import('storybook-solidjs-vite').StoryObj<typeof meta>}
 */
export const Default = {
  render: () => (
    <MemoryRouterShell>
      <div class="w-[380px]">
        <BackToLoginLink />
      </div>
    </MemoryRouterShell>
  ),
}
