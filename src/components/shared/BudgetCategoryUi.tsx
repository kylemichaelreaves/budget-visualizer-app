import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { Badge } from '@components/ui/badge'
import { TransactionTagIcon } from '@shared/icons/TransactionTagIcon'
import { cn } from '@utils/cn'

const defaultPillBadgeClass = 'text-xs hover:bg-accent transition-colors'

export function AssignCategoryTrigger(props: {
  onClick: () => void
  dataTestId: string
  disabled?: boolean
  class?: string
  /** When false, matches compact contexts that omit the tag icon. */
  showIcon?: boolean
  /** Defaults to "Assign category". */
  label?: string
}): JSX.Element {
  const showIcon = () => props.showIcon !== false
  return (
    <button
      type="button"
      disabled={props.disabled}
      onClick={() => props.onClick()}
      data-testid={props.dataTestId}
      class={cn(
        'flex items-center gap-1.5 text-xs text-muted-foreground border border-dashed rounded-full px-3 py-1 hover:border-brand hover:text-brand transition-colors cursor-pointer bg-transparent disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
        props.class,
      )}
    >
      <Show when={showIcon()}>
        <TransactionTagIcon />
      </Show>
      {props.label ?? 'Assign category'}
    </button>
  )
}

type BudgetCategoryPillOwnProps = {
  label: string
  /** Merged onto the Badge (e.g. Tailwind accent from getMemosTableCategoryColor). */
  class?: string
  /** Accent colors; see `accentOn`. */
  style?: JSX.CSSProperties
  /** Shown after the label inside the badge (e.g. split amount). */
  trailing?: JSX.Element
  /** When set, wraps the badge in a focusable button. */
  interactive?: boolean
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
  onDblClick?: (e: MouseEvent) => void
  title?: string
  /** Omitted for non-unique cases (e.g. multiple split lines per row). */
  dataTestId?: string
  /** Extra classes on the outer button when interactive. */
  buttonClass?: string
  truncate?: boolean
  /**
   * `badge` — inline style applies to Badge (default row category).
   * `button` — inline style applies to the outer button (split rows with shared border).
   */
  accentOn?: 'badge' | 'button'
}

export function BudgetCategoryPill(props: BudgetCategoryPillOwnProps): JSX.Element {
  const accentOn = () => props.accentOn ?? 'badge'
  const badgeStyle = () => (accentOn() === 'badge' ? props.style : undefined)
  const buttonStyle = () => (accentOn() === 'button' ? props.style : undefined)

  const badgeClass = () =>
    cn(
      'inline-flex items-center gap-1',
      defaultPillBadgeClass,
      props.truncate && 'max-w-full truncate min-w-0',
      accentOn() === 'button' && 'border-0 shadow-none',
      props.class,
    )

  const inner = () => (
    <Badge variant="outline" class={badgeClass()} style={badgeStyle()}>
      <span class={cn(props.truncate && 'truncate min-w-0')}>{props.label}</span>
      {props.trailing}
    </Badge>
  )

  return (
    <Show
      when={props.interactive}
      fallback={
        <Badge variant="outline" class={badgeClass()} style={badgeStyle()}>
          <span class={cn(props.truncate && 'truncate min-w-0')}>{props.label}</span>
          {props.trailing}
        </Badge>
      }
    >
      <button
        type="button"
        disabled={props.disabled}
        title={props.title}
        style={buttonStyle()}
        onClick={(e) => props.onClick?.(e)}
        onDblClick={(e) => props.onDblClick?.(e)}
        {...(props.dataTestId ? { 'data-testid': props.dataTestId } : {})}
        class={cn(
          'cursor-pointer bg-transparent border-none p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          props.buttonClass,
        )}
      >
        {inner()}
      </button>
    </Show>
  )
}

/** Read-only empty state for category cells. */
export function BudgetCategoryPillEmpty(props: { class?: string }): JSX.Element {
  return <span class={cn('text-muted-foreground', props.class)}>—</span>
}
