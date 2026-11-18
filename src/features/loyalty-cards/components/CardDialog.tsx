import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

/** A nested dialog uses the same focus and dismissal stack as the card drawer. */
export default function CardDialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="bg-ink-950/50 fixed inset-0 z-[60]" />
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4">
          <Dialog.Content
            aria-describedby={undefined}
            className="rounded-card bg-cream shadow-float dark:bg-forest-900 pointer-events-auto w-full max-w-lg p-6 text-left focus:outline-none sm:p-8"
          >
            <Dialog.Title className="font-display text-ink text-lg font-semibold dark:text-white">
              {title}
            </Dialog.Title>
            <div className="mt-4">{children}</div>
            {footer && (
              <div className="mt-6 flex justify-end gap-3">{footer}</div>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
