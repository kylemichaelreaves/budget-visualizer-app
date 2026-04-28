import type { JSX } from 'solid-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'

export function SettingsSectionCard(props: { title: string; description?: string; children: JSX.Element }) {
  return (
    <Card class="rounded-2xl overflow-hidden shadow-sm">
      <CardHeader>
        <CardTitle class="text-lg font-semibold">{props.title}</CardTitle>
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
      <CardContent class="flex flex-col gap-6 pb-6">{props.children}</CardContent>
    </Card>
  )
}
