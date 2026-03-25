import type { JSX } from 'solid-js'
import { createEffect } from 'solid-js'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function EquationComponent(props: { equation: string }): JSX.Element {
  let container: HTMLDivElement | undefined

  createEffect(() => {
    const tex = props.equation
    if (!container) return
    katex.render(tex, container, { throwOnError: false })
  })

  return (
    <div
      ref={(el) => {
        container = el
        if (el) {
          katex.render(props.equation, el, { throwOnError: false })
        }
      }}
    />
  )
}
