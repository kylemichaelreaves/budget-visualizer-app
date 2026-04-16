export function AuthDivider(props: { label?: string }) {
  return (
    <div class="flex items-center gap-3 text-muted-foreground/50 text-xs">
      <div class="flex-1 border-t border-border" />
      {props.label ?? 'or'}
      <div class="flex-1 border-t border-border" />
    </div>
  )
}
