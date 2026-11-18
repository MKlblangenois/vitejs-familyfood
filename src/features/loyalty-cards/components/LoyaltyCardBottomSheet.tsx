import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import {
  ArrowsPointingOutIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useLoyaltyCard,
  useUpdateLoyaltyCard,
  useDeleteLoyaltyCard,
  useWakeLock,
} from '../hooks'
import BarcodeRenderer from './BarcodeRenderer'
import LoyaltyCardForm from './LoyaltyCardForm'
import ShareCardDialog from './ShareCardDialog'
import Button from '../../../shared/components/Button'
import CardDialog from './CardDialog'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardBottomSheetProps {
  card: LoyaltyCard | null
  open: boolean
  onClose: () => void
  onClosed: () => void
}

const LoyaltyCardBottomSheet = ({
  card,
  open,
  onClose,
  onClosed,
}: LoyaltyCardBottomSheetProps) => {
  const { user } = useAuth()
  const {
    data: fullCard,
    isLoading,
    isError,
    refetch,
  } = useLoyaltyCard(card?.id ?? '')
  const updateMutation = useUpdateLoyaltyCard()
  const deleteMutation = useDeleteLoyaltyCard()
  const [isEditMode, setIsEditMode] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isCheckout, setIsCheckout] = useState(false)
  const openRef = useRef(open)
  useLayoutEffect(() => {
    openRef.current = open
  }, [open])
  useWakeLock(open && isCheckout)

  const closeCard = useCallback(() => {
    setIsShareOpen(false)
    setIsDeleteOpen(false)
    onClose()
  }, [onClose])

  const isOwner = !!fullCard && fullCard.user_id === user?.id
  const handleUpdate = useCallback(
    (data: {
      store_name: string
      barcode_value: string | null
      barcode_format: string | null
      card_color: string
    }) => {
      if (!fullCard) return
      updateMutation.mutate(
        { id: fullCard.id, ...data },
        { onSuccess: () => setIsEditMode(false) },
      )
    },
    [fullCard, updateMutation],
  )
  const handleDelete = useCallback(() => {
    if (!fullCard) return
    deleteMutation.mutate(fullCard.id, {
      onSuccess: () => {
        closeCard()
      },
    })
  }, [fullCard, deleteMutation, closeCard])

  return (
    <>
      <Drawer.Root
        open={open}
        onOpenChange={(next) => {
          if (!next) closeCard()
        }}
        handleOnly
        closeThreshold={0.4}
        onAnimationEnd={(isOpen) => {
          if (!isOpen && !openRef.current) {
            setIsEditMode(false)
            setIsCheckout(false)
            onClosed()
          }
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="bg-ink-950/50 dark:bg-ink-950/80 fixed inset-0 z-50" />
          <Drawer.Content
            aria-describedby={undefined}
            onEscapeKeyDown={(event) => {
              if (isShareOpen || isDeleteOpen) event.preventDefault()
            }}
            onInteractOutside={(event) => {
              if (isShareOpen || isDeleteOpen) event.preventDefault()
            }}
            className={`loyalty-drawer bg-cream shadow-float dark:bg-forest-900 fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full flex-col outline-none sm:max-w-xl ${isCheckout ? 'h-[100dvh] max-h-[100dvh] rounded-none' : 'max-h-[min(85dvh,48rem)] rounded-t-3xl'}`}
          >
            {!isCheckout && (
              <Drawer.Handle
                aria-label="Faire glisser pour fermer"
                className="mt-4 mb-2 shrink-0"
              />
            )}
            <div
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-7"
              data-vaul-no-drag
            >
              <div
                className={`flex items-center justify-between gap-3 ${isCheckout ? 'pt-[max(1rem,env(safe-area-inset-top))]' : 'pt-2'}`}
              >
                <div className="min-w-0">
                  <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.18em] uppercase">
                    {isCheckout ? 'Prête à présenter' : 'Carte de fidélité'}
                  </p>
                  <Drawer.Title className="font-display text-ink mt-1 text-2xl font-medium break-words dark:text-white">
                    {fullCard?.store_name ??
                      card?.store_name ??
                      'Carte de fidélité'}
                  </Drawer.Title>
                </div>
                <button
                  type="button"
                  onClick={closeCard}
                  aria-label="Fermer la carte"
                  className="bg-sand-100 text-ink focus-visible:outline-forest-600 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-white/10 dark:text-white"
                >
                  <XMarkIcon aria-hidden="true" className="size-5" />
                </button>
              </div>

              {isLoading && (
                <div className="mt-6 space-y-4">
                  <LoadingSkeleton className="h-48 w-full" />
                  <LoadingSkeleton className="h-12 w-full" />
                </div>
              )}
              {isError && (
                <div className="py-8 text-center">
                  <p className="text-ink-500 dark:text-ink-300 text-sm/6">
                    Impossible de charger cette carte.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => void refetch()}
                  >
                    Réessayer
                  </Button>
                </div>
              )}
              {!isLoading &&
                !isError &&
                fullCard &&
                (isEditMode ? (
                  <div className="pt-6">
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="text-forest-600 dark:text-sage-300 mb-4 min-h-11 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      ← Retour à la carte
                    </button>
                    {updateMutation.isError && (
                      <p role="alert" className="text-error-600 mb-4 text-sm">
                        Impossible d’enregistrer la carte. Veuillez réessayer.
                      </p>
                    )}
                    <LoyaltyCardForm
                      card={fullCard}
                      onSubmit={handleUpdate}
                      onCancel={() => setIsEditMode(false)}
                      isPending={updateMutation.isPending}
                    />
                    <div className="border-sand-200 my-6 border-t dark:border-white/10" />
                    <div className="space-y-2">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setIsShareOpen(true)}
                        icon={
                          <UserGroupIcon
                            aria-hidden="true"
                            className="size-5"
                          />
                        }
                      >
                        Partager
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setIsDeleteOpen(true)}
                        icon={
                          <TrashIcon aria-hidden="true" className="size-5" />
                        }
                      >
                        Supprimer la carte
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`flex flex-col ${isCheckout ? 'min-h-0 flex-1 justify-center' : 'pt-6'}`}
                  >
                    {fullCard.barcode_value && fullCard.barcode_format ? (
                      <>
                        <div className="rounded-card border-sand-200 relative flex min-w-0 flex-col items-center gap-3 overflow-hidden border bg-white p-5 sm:p-6">
                          <BarcodeRenderer
                            value={fullCard.barcode_value}
                            format={fullCard.barcode_format}
                            className="flex w-full max-w-full items-center justify-center"
                            large={isCheckout}
                          />
                          {fullCard.barcode_format !== 'QR_CODE' && (
                            <p className="text-ink-600 max-w-full text-center font-mono text-sm tracking-wider break-all">
                              {fullCard.barcode_value}
                            </p>
                          )}
                          {!isCheckout && (
                            <button
                              type="button"
                              aria-label="Afficher le code en grand"
                              onClick={() => setIsCheckout(true)}
                              className="rounded-card focus-visible:outline-forest-600 absolute inset-0 focus-visible:outline-2 focus-visible:outline-offset-2"
                            />
                          )}
                        </div>
                        {!isCheckout && (
                          <button
                            type="button"
                            onClick={() => setIsCheckout(true)}
                            className="rounded-control text-forest-600 dark:text-sage-300 mt-3 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
                          >
                            <ArrowsPointingOutIcon
                              aria-hidden="true"
                              className="size-4"
                            />
                            Afficher en grand
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="rounded-card border-sand-300 bg-sand-50 border border-dashed py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                        <p className="text-ink-500 dark:text-ink-300 text-sm">
                          Aucun code-barres enregistré
                        </p>
                      </div>
                    )}
                    {isCheckout ? (
                      <Button
                        variant="secondary"
                        className="mt-6 w-full"
                        onClick={() => setIsCheckout(false)}
                      >
                        Retour à la carte
                      </Button>
                    ) : (
                      isOwner && (
                        <Button
                          variant="secondary"
                          className="mt-4 w-full"
                          onClick={() => setIsEditMode(true)}
                          icon={
                            <PencilIcon aria-hidden="true" className="size-5" />
                          }
                        >
                          Modifier
                        </Button>
                      )
                    )}
                  </div>
                ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
        {isShareOpen && fullCard && (
          <ShareCardDialog
            open={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            cardId={fullCard.id}
            members={fullCard.loyalty_card_members ?? []}
            currentUserId={user?.id ?? ''}
          />
        )}
        <CardDialog
          open={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          title="Supprimer la carte ?"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? 'Suppression…'
                  : 'Supprimer la carte'}
              </Button>
            </>
          }
        >
          <p className="text-ink-500 dark:text-ink-300 text-sm/6">
            Voulez-vous vraiment supprimer la carte de « {fullCard?.store_name}{' '}
            » ? Cette action est irréversible.
          </p>
          {deleteMutation.isError && (
            <p role="alert" className="text-error-600 mt-3 text-sm">
              Impossible de supprimer la carte. Veuillez réessayer.
            </p>
          )}
        </CardDialog>
      </Drawer.Root>
    </>
  )
}

export default LoyaltyCardBottomSheet
