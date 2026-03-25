import type { JSX } from 'solid-js'
import { Show, createMemo } from 'solid-js'
import type { LoanFormType } from '@types'

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
    <label style={{ display: 'flex', 'flex-direction': 'column', gap: '6px', margin: '10px 0' }}>
      <span style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>{props.field.label}</span>
      {props.field.tooltip ? (
        <span title={props.field.tooltip} style={{ color: '#7f8c8d', 'font-size': '0.75rem' }}>
          {props.field.tooltip}
        </span>
      ) : null}
      {inner}
    </label>
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
        <input
          type="number"
          placeholder={props.field.placeholder}
          value={Number(value()) || ''}
          {...numProps()}
          onInput={(e) => {
            const n = Number(e.currentTarget.value)
            const next = { ...props.model, [props.field.prop]: Number.isFinite(n) ? n : 0 }
            props.onChange(next as LoanFormType)
          }}
          style={{
            padding: '8px',
            'border-radius': '4px',
            border: '1px solid #555',
            background: '#2c2c2c',
            color: '#ecf0f1',
          }}
        />,
      )}
    >
      {wrap(
        <input
          type="date"
          placeholder={props.field.placeholder}
          value={iso()}
          onInput={(e) => {
            const v = e.currentTarget.value
            const next = { ...props.model, [props.field.prop]: v ? new Date(v + 'T12:00:00') : new Date() }
            props.onChange(next as LoanFormType)
          }}
          style={{
            padding: '8px',
            'border-radius': '4px',
            border: '1px solid #555',
            background: '#2c2c2c',
            color: '#ecf0f1',
          }}
        />,
      )}
    </Show>
  )
}
