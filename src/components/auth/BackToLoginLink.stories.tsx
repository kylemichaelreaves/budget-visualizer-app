import { MemoryRouter, Route } from '@solidjs/router'
import { BackToLoginLink } from './BackToLoginLink'

const meta = {
  title: 'Auth/BackToLoginLink',
  component: BackToLoginLink,
  tags: ['autodocs', '!test'],
  parameters: {
    layout: 'centered',
  },
}

export default meta

/** `<A>` needs router context; use MemoryRouter like other auth stories. */
export const Default = {
  render: () => (
    <MemoryRouter root={(r) => r.children}>
      <Route
        path="/"
        component={() => (
          <div class="w-[380px]">
            <BackToLoginLink />
          </div>
        )}
      />
    </MemoryRouter>
  ),
}
