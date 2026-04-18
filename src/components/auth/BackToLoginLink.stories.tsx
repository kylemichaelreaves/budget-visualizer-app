import { MemoryRouter, Route } from '@solidjs/router'
import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import type { JSX } from 'solid-js'
import { BackToLoginLink } from './BackToLoginLink'

/** `<A>` needs router context; bare `Router` has no routes — use MemoryRouter like other stories. */
function WithRouter(props: { children: JSX.Element }) {
  return (
    <MemoryRouter root={(r) => r.children}>
      <Route path="/" component={() => props.children} />
    </MemoryRouter>
  )
}

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
    <WithRouter>
      <div class="w-[380px]">
        <BackToLoginLink />
      </div>
    </WithRouter>
  ),
}
