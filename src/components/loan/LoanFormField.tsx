import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import type { LoanFormType } from '@types'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

export type LoanFieldDef = {
  label: string
  prop: keyof LoanFormType
  placeholder: string
  type: 'number' | 'date'
  tooltip?: string
}

export default function LoanFormField(props: {
  field: LoanFieldDef
  model: LoanFormType
  onChange: (next: LoanFormType) => void
}): JSX.Element {
  const value = () => props.model[props.field.prop]

  const numProps = createMemo(() => {
    const prop = props.field.prop
    if (prop === 'interestRate') return { min: 0, max: 100, step: 0.1 }
    if (prop === 'loanTerm') return { min: 0, step: 1 }
    return { min: 0, step: 0.01 }
  })

  const wrap = (inner: JSX.Element) => (
    <div class="flex flex-col gap-1.5 my-2.5">
      <Label class="text-muted-foreground text-sm">{props.field.label}</Label>
      {props.field.tooltip ? (
        <span title={props.field.tooltip} class="text-xs text-muted-foreground/70">
          {props.field.tooltip}
        </span>
      ) : null}
      {inner}
    </div>
  )

  const iso = () => {
    const d = value() as Date
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  return (
    <Show
      when={props.field.type === 'date'}
      fallback={wrap(
        <Input
          type="number"
          placeholder={props.field.placeholder}
          value={Number(value()) || ''}
          {...numProps()}
          onInput={(e) => {
            const n = Number(e.currentTarget.value)
            const next = { ...props.model, [props.field.prop]: Number.isFinite(n) ? n : 0 }
            props.onChange(next as LoanFormType)
          }}
        />,
      )}
    >
      {wrap(
        <Input
          type="date"
          placeholder={props.field.placeholder}
          value={iso()}
          onInput={(e) => {
            const v = e.currentTarget.value
            const next = { ...props.model, [props.field.prop]: v ? new Date(v + 'T12:00:00') : new Date() }
            props.onChange(next as LoanFormType)
          }}
        />,
      )}
    </Show>
  )
}
