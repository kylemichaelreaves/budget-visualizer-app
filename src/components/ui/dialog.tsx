import { type ParentProps, omit } from 'solid-js'
import * as DialogPrimitive from '@kobalte/core/dialog'
import { cn } from '@utils/cn'
import type { JSX } from '@solidjs/web'

function Dialog(props: DialogPrimitive.DialogRootProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(props: DialogPrimitive.DialogTriggerProps & { class?: string }) {
  const rest = omit(props, 'class')
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" class={props.class} {...rest} />
}

function DialogPortal(props: DialogPrimitive.DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(props: DialogPrimitive.DialogCloseButtonProps & { class?: string }) {
  const rest = omit(props, 'class')
  return <DialogPrimitive.CloseButton data-slot="dialog-close" class={props.class} {...rest} />
}

type DialogOverlayProps = DialogPrimitive.DialogOverlayProps & {
  class?: string
  onClick?: (e: MouseEvent) => void
}

function DialogOverlay(props: DialogOverlayProps) {
  const rest = omit(props, 'class')
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      class={cn(
        'data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 fixed inset-0 z-50 bg-black/50',
        props.class,
      )}
      {...rest}
    />
  )
}

type DialogContentProps = ParentProps<
  { class?: string } & Omit<DialogPrimitive.DialogContentProps, 'children'>
>

/**
 * Escape and outside clicks close the dialog here as well as in Kobalte.
 *
 * Kobalte 2.0.0-alpha.5's `DismissableLayer` registers itself in the layer stack
 * from an `onSettled` that runs before its element ref is committed under Solid
 * 2, so a dialog never becomes the top-most layer and Kobalte ignores both
 * Escape and outside pointer-downs. Closing through the dialog context is
 * idempotent, so this stays correct once Kobalte fixes it upstream, and can then
 * be removed.
 */
function useDialogDismissFallback() {
  const context = DialogPrimitive.useDialogContext()
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    // An open combobox or listbox inside the dialog takes Escape for itself.
    if ((e.target as Element | null)?.closest('[aria-expanded="true"]')) return
    e.preventDefault()
    context.close()
  }
  const onOverlayClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) context.close()
  }
  return { onKeyDown, onOverlayClick }
}

function DialogContent(props: DialogContentProps) {
  const rest = omit(props, 'class', 'children')
  const dismiss = useDialogDismissFallback()
  return (
    <DialogPortal>
      <DialogOverlay onClick={dismiss.onOverlayClick} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        class={cn(
          'bg-background data-[expanded]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[expanded]:fade-in-0 data-[closed]:zoom-out-95 data-[expanded]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg',
          props.class,
        )}
        onKeyDown={dismiss.onKeyDown}
        {...rest}
      >
        {props.children}
        <DialogPrimitive.CloseButton
          data-slot="dialog-close"
          class="ring-offset-background focus:ring-ring data-[expanded]:bg-accent data-[expanded]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
          <span class="sr-only">Close</span>
        </DialogPrimitive.CloseButton>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="dialog-header"
      class={cn('flex flex-col gap-2 text-center sm:text-left', props.class)}
      {...rest}
    />
  )
}

function DialogFooter(props: JSX.HTMLAttributes<HTMLDivElement> & { class?: string }) {
  const rest = omit(props, 'class')
  return (
    <div
      data-slot="dialog-footer"
      class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', props.class)}
      {...rest}
    />
  )
}

type DialogTitleProps = DialogPrimitive.DialogTitleProps & { class?: string }

function DialogTitle(props: DialogTitleProps) {
  const rest = omit(props, 'class')
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      class={cn('text-lg leading-none font-semibold', props.class)}
      {...rest}
    />
  )
}

type DialogDescriptionProps = DialogPrimitive.DialogDescriptionProps & { class?: string }

function DialogDescription(props: DialogDescriptionProps) {
  const rest = omit(props, 'class')
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      class={cn('text-muted-foreground text-sm', props.class)}
      {...rest}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
