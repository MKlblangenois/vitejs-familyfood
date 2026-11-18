import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

type ModalSize = 'sm' | 'md' | 'lg'
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
}
const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) => (
  <Dialog.Root
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose()
    }}
  >
    <Dialog.Portal>
      <Dialog.Overlay className="bg-ink-950/50 dark:bg-ink-950/80 fixed inset-0 z-[60]" />
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-end justify-center overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-4">
        <Dialog.Content
          aria-describedby={undefined}
          className={`rounded-card bg-cream shadow-float dark:bg-forest-900 pointer-events-auto w-full p-6 text-left outline-none sm:p-8 ${sizeClasses[size]}`}
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
export default Modal
