import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import { fn } from 'storybook/test'
import SelectComponent from './SelectComponent'

const sampleOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'all', label: 'All statuses' },
]

const meta = {
  title: 'Shared/SelectComponent',
  component: SelectComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof SelectComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [value, setValue] = createSignal('pending')
    return (
      <div class="w-80">
        <SelectComponent
          options={sampleOptions}
          selectedValue={value()}
          placeholder="Status"
          onChange={setValue}
          dataTestId="story-select-default"
        />
      </div>
    )
  },
}

export const Loading: Story = {
  render: () => {
    const [value, setValue] = createSignal('')
    return (
      <div class="w-80">
        <SelectComponent
          options={sampleOptions}
          selectedValue={value()}
          placeholder="Loading…"
          onChange={setValue}
          loading
          loadingText="Fetching options…"
          dataTestId="story-select-loading"
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: {
    options: sampleOptions,
    selectedValue: 'reviewed',
    placeholder: 'Disabled',
    onChange: fn(),
    disabled: true,
    dataTestId: 'story-select-disabled',
  },
}
