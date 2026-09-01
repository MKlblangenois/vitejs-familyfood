import type { ReactNode } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

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
}: ModalProps) => {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-ink-950/50 transition-opacity data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-ink-950/80"
      />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className={`relative w-full transform overflow-hidden rounded-card bg-cream p-6 text-left shadow-float transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in dark:bg-forest-900 sm:p-8 ${sizeClasses[size]}`}
          >
            <DialogTitle className="font-display text-lg font-semibold text-ink dark:text-white">
              {title}
            </DialogTitle>

            <div className="mt-4">{children}</div>

            {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

export default Modal
