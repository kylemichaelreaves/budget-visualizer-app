import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import AlertComponent from './AlertComponent'

const meta = {
  title: 'Shared/AlertComponent',
  component: AlertComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AlertComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    type: 'success',
    title: 'Saved',
    message: 'Your changes were applied successfully.',
    dataTestId: 'story-alert-success',
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    title: 'Heads up',
    message: 'This action may affect linked transactions.',
    dataTestId: 'story-alert-warning',
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    title: 'Tip',
    message: 'You can filter the table using the controls above.',
    dataTestId: 'story-alert-info',
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    title: 'Request failed',
    message: 'The server returned an error. Try again in a moment.',
    dataTestId: 'story-alert-error',
  },
}

export const Dismissible: Story = {
  render: () => {
    const [visible, setVisible] = createSignal(true)
    return (
      <div class="w-full max-w-md">
        {visible() ? (
          <AlertComponent
            type="info"
            title="Dismissible"
            message="Click the × to hide this alert."
            dataTestId="story-alert-dismiss"
            close={() => setVisible(false)}
          />
        ) : (
          <p class="text-sm text-muted-foreground">Alert dismissed.</p>
        )}
      </div>
    )
  },
}
