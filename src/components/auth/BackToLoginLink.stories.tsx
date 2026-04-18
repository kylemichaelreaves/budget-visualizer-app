import { MemoryRouter, Route } from '@solidjs/router'
import { BackToLoginLink } from './BackToLoginLink'

function WithRouter(props: { children: unknown }) {
  return (
    <MemoryRouter root={(r) => r.children}>
      <Route path="/" component={() => props.children as never} />
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
}

export default meta

export const Default = {
  render: () => (
    <WithRouter>
      <div class="w-[380px]">
        <BackToLoginLink />
      </div>
    </WithRouter>
  ),
}
