import { fireEvent, render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { Dialog, DialogContent, DialogTitle } from '@components/ui/dialog'

// Kobalte 2.0.0-alpha.5 never registers a dialog as a dismissable layer under
// Solid 2, so `ui/dialog` closes on Escape and on an overlay click itself.

function renderDialog() {
  const onOpenChange = vi.fn()
  const [open, setOpen] = createSignal(true)
  render(() => (
    <Dialog
      open={open()}
      onOpenChange={(next) => {
        onOpenChange(next)
        setOpen(next)
      }}
    >
      <DialogContent data-testid="dialog">
        <DialogTitle>Title</DialogTitle>
        <input data-testid="plain-input" />
        <input data-testid="open-combobox" aria-expanded="true" />
      </DialogContent>
    </Dialog>
  ))
  return onOpenChange
}

const overlay = () => document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]')!

describe('dialog dismiss fallback', () => {
  it('closes on Escape', () => {
    const onOpenChange = renderDialog()
    fireEvent.keyDown(screen.getByTestId('plain-input'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('ignores other keys', () => {
    const onOpenChange = renderDialog()
    fireEvent.keyDown(screen.getByTestId('plain-input'), { key: 'Enter' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('leaves Escape to an open combobox inside the dialog', () => {
    const onOpenChange = renderDialog()
    fireEvent.keyDown(screen.getByTestId('open-combobox'), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('closes on an overlay click, not on a click inside the content', () => {
    const onOpenChange = renderDialog()
    fireEvent.click(screen.getByTestId('plain-input'))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
