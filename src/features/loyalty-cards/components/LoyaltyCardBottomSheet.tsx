import { useState, useCallback, useEffect } from 'react'
import { PencilIcon, TrashIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useLoyaltyCard,
  useUpdateLoyaltyCard,
  useDeleteLoyaltyCard,
} from '../hooks'
import BarcodeRenderer from './BarcodeRenderer'
import LoyaltyCardForm from './LoyaltyCardForm'
import ShareCardDialog from './ShareCardDialog'
import Button from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'
import type { LoyaltyCard } from '../types'

interface LoyaltyCardBottomSheetProps {
  card: LoyaltyCard | null
  onClose: () => void
}

const LoyaltyCardBottomSheet = ({
  card,
  onClose,
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

  const isOwner = fullCard ? fullCard.user_id === user?.id : false

  // Prevent body scroll while the sheet is open
  useEffect(() => {
    if (!card) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [card])

  // Close on Escape key
  useEffect(() => {
    if (!card) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [card, onClose])

  // Reset states when the sheet closes
  useEffect(() => {
    if (!card) {
      setIsEditMode(false)
      setIsShareOpen(false)
      setIsDeleteOpen(false)
    }
  }, [card])

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
        setIsDeleteOpen(false)
        onClose()
      },
    })
  }, [fullCard, deleteMutation, onClose])

  if (!card) return null

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/50 transition-opacity duration-300 dark:bg-ink-950/80"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-cream shadow-float transition-transform duration-300 ease-out dark:bg-forest-900">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="h-1 w-10 rounded-full bg-sand-300 dark:bg-white/20" />
        </div>

        {/* Content */}
        <div className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {isLoading && (
            <div className="space-y-4">
              <LoadingSkeleton className="h-48 w-full" />
              <LoadingSkeleton className="h-12 w-full" />
            </div>
          )}

          {isError && (
            <div className="py-8 text-center">
              <p className="text-sm/6 text-ink-500 dark:text-ink-300">
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

          {!isLoading && !isError && fullCard && (
            <>
              {isEditMode ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(false)}
                    className="mb-4 text-sm font-medium text-forest-600 transition-colors hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
                  >
                    ← Retour
                  </button>
                  <LoyaltyCardForm
                    card={fullCard}
                    onSubmit={handleUpdate}
                    onCancel={() => setIsEditMode(false)}
                    isPending={updateMutation.isPending}
                  />

                  {/* Divider */}
                  <div className="my-6 border-t border-sand-200 dark:border-white/10" />

                  {/* Share + Delete actions */}
                  <div className="space-y-2">
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => setIsShareOpen(true)}
                      icon={<UserGroupIcon aria-hidden="true" className="size-5" />}
                    >
                      Partager
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setIsDeleteOpen(true)}
                      icon={<TrashIcon aria-hidden="true" className="size-5" />}
                    >
                      Supprimer la carte
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Store name */}
                  <h2 className="mb-4 text-center font-display text-xl font-bold text-ink dark:text-white">
                    {fullCard.store_name}
                  </h2>

                  {/* Barcode — large and centered */}
                  {fullCard.barcode_value && fullCard.barcode_format ? (
                    <div className="flex flex-col items-center gap-3 rounded-card border border-sand-200 bg-white p-6 dark:border-white/10 dark:bg-forest-950">
                      <BarcodeRenderer
                        value={fullCard.barcode_value}
                        format={fullCard.barcode_format}
                        className="flex items-center justify-center"
                      />
                      {fullCard.barcode_format !== 'QR_CODE' && (
                        <p className="font-mono text-sm tracking-wider text-ink-500 dark:text-ink-300">
                          {fullCard.barcode_value}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-card border border-dashed border-sand-300 bg-sand-50 py-8 text-center dark:border-white/10 dark:bg-white/[0.02]">
                      <p className="text-sm text-ink-400 dark:text-ink-300">
                        Aucun code-barres enregistré
                      </p>
                    </div>
                  )}

                  {/* Modifier button */}
                  {isOwner && (
                    <div className="mt-4">
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setIsEditMode(true)}
                        icon={<PencilIcon aria-hidden="true" className="size-5" />}
                      >
                        Modifier
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Share dialog */}
      {isShareOpen && fullCard && (
        <ShareCardDialog
          open={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          cardId={fullCard.id}
          members={fullCard.loyalty_card_members ?? []}
          currentUserId={user?.id ?? ''}
        />
      )}

      {/* Delete confirmation */}
      <Modal
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
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending
                ? 'Suppression…'
                : 'Supprimer la carte'}
            </Button>
          </>
        }
      >
        <p className="text-sm/6 text-ink-500 dark:text-ink-300">
          Voulez-vous vraiment supprimer la carte de « {fullCard?.store_name} » ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default LoyaltyCardBottomSheet
