import type { Meta, StoryObj } from 'storybook-solidjs-vite'
import { createSignal } from 'solid-js'
import AutocompleteComponent, { type AutocompleteOption } from './AutocompleteComponent'

const fruitOptions: AutocompleteOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
]

const meta = {
  title: 'Shared/AutocompleteComponent',
  component: AutocompleteComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AutocompleteComponent>

export default meta
type Story = StoryObj<typeof meta>

export const StaticOptions: Story = {
  render: () => {
    const [value, setValue] = createSignal('apple')
    return (
      <div class="w-80">
        <AutocompleteComponent
          value={value()}
          onChange={setValue}
          options={fruitOptions}
          placeholder="Pick a fruit"
          dataTestId="story-autocomplete-static"
        />
      </div>
    )
  },
}

export const WithBlurCommit: Story = {
  render: () => {
    const [value, setValue] = createSignal('free text')
    const [lastBlur, setLastBlur] = createSignal<string | null>(null)
    return (
      <div class="w-80 space-y-2 text-sm">
        <AutocompleteComponent
          value={value()}
          onChange={setValue}
          options={fruitOptions}
          placeholder="Type then tab out"
          onInputBlur={() => setLastBlur(`blur at ${value()}`)}
          dataTestId="story-autocomplete-blur"
        />
        <p class="text-muted-foreground">Last blur: {lastBlur() ?? '—'}</p>
      </div>
    )
  },
}

export const AsyncSearch: Story = {
  render: () => {
    const [value, setValue] = createSignal('')
    return (
      <div class="w-80">
        <AutocompleteComponent
          value={value()}
          onChange={setValue}
          options={[]}
          placeholder="Type 1+ chars (debounced)"
          minCharacters={1}
          onSearch={(q, done) => {
            window.setTimeout(() => {
              const qn = q.trim().toLowerCase()
              const hits = fruitOptions.filter((o) => o.label.toLowerCase().includes(qn))
              done(hits.length ? hits : [{ value: q, label: `Create “${q}”` }])
            }, 400)
          }}
          dataTestId="story-autocomplete-async"
        />
      </div>
    )
  },
}
