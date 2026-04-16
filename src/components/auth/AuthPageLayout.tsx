import type { JSX } from 'solid-js'
import { Card, CardContent } from '@components/ui/card'

export function AuthPageLayout(props: { children: JSX.Element }) {
  return (
    <div class="flex min-h-screen flex-col items-center justify-center bg-background p-5">
      <Card class="w-full max-w-[420px]">
        <CardContent class="p-6">{props.children}</CardContent>
      </Card>
    </div>
  )
}
