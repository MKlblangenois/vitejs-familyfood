import { useEffect, useRef, useState } from 'react'
import { DetailDrawerContext } from './detailDrawerContext'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from 'vaul'
import { XMarkIcon } from '@heroicons/react/24/outline'

/** A route-backed sheet preserves the catalogue and its scroll position underneath. */
export default function DetailDrawer({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  const navigate = useNavigate()
  const returning = useRef(false)
  const [scaleBackground, setScaleBackground] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(
      '(max-width: 639px) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setScaleBackground(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      shouldScaleBackground={scaleBackground}
      closeThreshold={0.4}
      onAnimationEnd={(isOpen) => {
        if (!isOpen && !returning.current) {
          returning.current = true
          void navigate(-1)
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="bg-ink-950/45 fixed inset-0 z-50" />
        <Drawer.Content
          aria-describedby={undefined}
          className="detail-drawer bg-cream shadow-float dark:bg-ink-950 fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top,0px)))] max-h-[calc(100dvh-max(1.5rem,env(safe-area-inset-top,0px)))] w-full flex-col overflow-hidden rounded-t-3xl outline-none sm:max-w-5xl"
        >
          <div className="border-sand-200/60 bg-cream dark:bg-ink-950 relative flex h-14 shrink-0 items-center border-b dark:border-white/10">
            <Drawer.Handle aria-label="Faire glisser pour fermer" />
            <Drawer.Title className="sr-only">{title}</Drawer.Title>
            <Drawer.Close
              aria-label={`Fermer : ${title}`}
              className="text-ink-600 focus-visible:outline-forest-600 dark:text-ink-200 absolute top-1/2 right-4 flex size-11 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <XMarkIcon aria-hidden="true" className="size-5" />
            </Drawer.Close>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:px-8"
            data-vaul-no-drag
          >
            <DetailDrawerContext.Provider value>
              {children}
            </DetailDrawerContext.Provider>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
