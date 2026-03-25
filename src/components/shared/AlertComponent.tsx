import type { JSX } from 'solid-js'
import { Show } from 'solid-js'

export type AlertType = 'success' | 'warning' | 'info' | 'error'

const typeStyles: Record<AlertType, { border: string; icon: string; iconBg: string }> = {
  error: { border: '#e74c3c', icon: '⚠', iconBg: 'rgba(231, 76, 60, 0.15)' },
  success: { border: '#27ae60', icon: '✓', iconBg: 'rgba(39, 174, 96, 0.15)' },
  warning: { border: '#f39c12', icon: '⚠', iconBg: 'rgba(243, 156, 18, 0.15)' },
  info: { border: '#3498db', icon: 'ℹ', iconBg: 'rgba(52, 152, 219, 0.15)' },
}

export default function AlertComponent(props: {
  type: AlertType
  title: string
  message: string
  close?: () => void
  dataTestId?: string
}): JSX.Element {
  const id = () => props.dataTestId ?? 'alert'
  const t = () => typeStyles[props.type]

  return (
    <div
      role="alert"
      data-testid={id()}
      style={{
        position: 'relative',
        padding: '12px 16px 12px 48px',
        margin: '8px 0',
        'border-radius': '6px',
        border: `1px solid ${t().border}`,
        background: '#2c2c2c',
        color: '#ecf0f1',
        'text-align': 'center',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '28px',
          height: '28px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'border-radius': '50%',
          background: t().iconBg,
          'font-size': '14px',
        }}
      >
        {t().icon}
      </span>
      <Show when={props.close}>
        {(onClose) => (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => onClose()()}
            style={{
              position: 'absolute',
              right: '8px',
              top: '8px',
              background: 'transparent',
              border: 'none',
              color: '#95a5a6',
              cursor: 'pointer',
              'font-size': '18px',
              'line-height': 1,
              padding: '4px',
            }}
          >
            ×
          </button>
        )}
      </Show>
      <strong data-testid={`${id()}-title`}>{props.title}</strong>
      <div
        data-testid={`${id()}-message`}
        style={{ 'margin-top': '6px', 'font-size': '0.9rem', color: '#bdc3c7' }}
      >
        {props.message}
      </div>
    </div>
  )
}
