import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ArrowsPointingOutIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../../auth/hooks/useAuth'
import {
  useLoyaltyCard,
  useUpdateLoyaltyCard,
  useDeleteLoyaltyCard,
} from '../hooks'
import type { LoyaltyCardMember } from '../types'
import { getStoreLogoUrl, getStoreInitial } from '../lib/logo'
import BarcodeRenderer from '../components/BarcodeRenderer'
import LoyaltyCardFullscreen from '../components/LoyaltyCardFullscreen'
import LoyaltyCardForm from '../components/LoyaltyCardForm'
import ShareCardDialog from '../components/ShareCardDialog'
import { ROLE_LABELS } from '../lib/roleLabels'
import Button from '../../../shared/components/Button'
import Badge from '../../../shared/components/Badge'
import Modal from '../../../shared/components/Modal'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'
import LoadingSkeleton from '../../../shared/components/LoadingSkeleton'

// ============================================================
// Sub-components
// ============================================================

function DetailLoadingState() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-6">
      <div className="h-5 w-24 animate-pulse rounded-control bg-sand-200 dark:bg-white/10" />
      <LoadingSkeleton className="h-40 w-full" />
      <LoadingSkeleton className="h-48 w-full" />
    </div>
  )
}

function DetailNotFoundState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-ink-300">
        <CreditCardIcon aria-hidden="true" className="size-7" />
      </div>
      <h2 className="font-display text-2xl font-semibold text-ink dark:text-white">
        Carte introuvable
      </h2>
      <p className="mt-2 max-w-sm text-sm/6 text-ink-500 dark:text-ink-300">
        Cette carte de fidélité a peut-être été supprimée ou n&apos;existe pas.
      </p>
      <Link
        to="/loyalty-cards"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-control bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 dark:bg-forest-600 dark:hover:bg-forest-500 dark:focus-visible:outline-forest-400"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Retour aux cartes
      </Link>
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const LoyaltyCardDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    data: card,
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useLoyaltyCard(id ?? '')
  const updateMutation = useUpdateLoyaltyCard()
  const deleteMutation = useDeleteLoyaltyCard()

  // Dialog states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const isOwner = card ? card.user_id === user?.id : false

  const members = useMemo(
    () => card?.loyalty_card_members ?? [],
    [card?.loyalty_card_members],
  )

  const logoUrl = card ? getStoreLogoUrl(card.store_name, 128) : null

  const handleUpdate = useCallback(
    (data: {
      store_name: string
      barcode_value: string | null
      barcode_format: string | null
      card_color: string
    }) => {
      if (!card) return
      updateMutation.mutate(
        { id: card.id, ...data },
        { onSuccess: () => setIsEditOpen(false) },
      )
    },
    [card, updateMutation],
  )

  const handleDelete = useCallback(() => {
    if (!card) return
    deleteMutation.mutate(card.id, {
      onSuccess: () => {
        setIsDeleteOpen(false)
        void navigate('/loyalty-cards')
      },
    })
  }, [card, deleteMutation, navigate])

  if (!id) return <DetailNotFoundState />
  if (isLoading) return <DetailLoadingState />
  if (isError) return <ErrorState title="Impossible de charger la carte" description="Une erreur est survenue lors du chargement de cette carte. Vérifiez votre connexion et réessayez." onRetry={() => void refetch()} />
  if (isFetched && !card) return <DetailNotFoundState />
  if (!card) return null

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back link */}
      <Link
        to="/loyalty-cards"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink dark:text-ink-300 dark:hover:text-white"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        Toutes les cartes
      </Link>

      {/* Card header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <h1 className="font-display text-2xl font-bold text-ink dark:text-white sm:text-3xl">
              {card.store_name}
            </h1>
            <div
              className="mt-1.5 size-4 shrink-0 rounded-full"
              style={{ backgroundColor: card.card_color }}
              aria-label="Couleur de la carte"
            />
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Badge variant={isOwner ? 'forest' : 'neutral'}>
              {isOwner ? ROLE_LABELS.owner : ROLE_LABELS.editor}
            </Badge>
            <span className="text-xs text-ink-500 dark:text-ink-300">
              {members.length} membre{members.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsShareOpen(true)}
              icon={<UserGroupIcon aria-hidden="true" className="size-4" />}
            >
              Partager
            </Button>
          )}
          {isOwner && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              icon={<PencilIcon aria-hidden="true" className="size-4" />}
            >
              Modifier
            </Button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-control border border-error-200 bg-white px-3 py-1.5 text-sm font-semibold text-error transition-colors hover:bg-error-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 dark:border-error-500/20 dark:bg-white/5 dark:text-error-400 dark:hover:bg-error-500/10 dark:focus-visible:outline-error-500"
            >
              <TrashIcon aria-hidden="true" className="size-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Logo display */}
      {logoUrl && (
        <div className="mb-6 flex items-center gap-4 rounded-card border border-sand-200 bg-white p-4 dark:border-white/10 dark:bg-forest-900">
          <img
            src={logoUrl}
            alt={`Logo de ${card.store_name}`}
            className="size-16 shrink-0 rounded-control object-contain"
          />
          <div>
            <p className="text-sm font-medium text-ink dark:text-white">
              {card.store_name}
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-300">
              Logo récupéré automatiquement
            </p>
          </div>
        </div>
      )}

      {!logoUrl && (
        <div className="mb-6 flex items-center gap-4 rounded-card border border-sand-200 bg-white p-4 dark:border-white/10 dark:bg-forest-900">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-control text-2xl font-bold text-white"
            style={{ backgroundColor: card.card_color }}
          >
            {getStoreInitial(card.store_name)}
          </div>
          <div>
            <p className="text-sm font-medium text-ink dark:text-white">
              {card.store_name}
            </p>
            <p className="text-xs text-ink-400 dark:text-ink-300">
              {card.logo_url ? 'Logo personnalisé' : 'Aucun logo disponible'}
            </p>
          </div>
        </div>
      )}

      {/* Barcode display */}
      <section aria-labelledby="barcode-heading" className="mb-6">
        <h2
          id="barcode-heading"
          className="mb-3 font-display text-xl font-bold text-ink dark:text-white"
        >
          Code-barres
        </h2>

        {card.barcode_value && card.barcode_format ? (
          <div className="rounded-card border border-sand-200 bg-white p-6 dark:border-white/10 dark:bg-forest-900">
            <div className="flex flex-col items-center gap-4">
              <BarcodeRenderer
                value={card.barcode_value}
                format={card.barcode_format}
                className="flex items-center justify-center"
              />
              {card.barcode_format !== 'QR_CODE' && (
                <p className="font-mono text-sm tracking-wider text-ink-500 dark:text-ink-300">
                  {card.barcode_value}
                </p>
              )}
            </div>

            <div className="mt-4 flex justify-center">
              <Button
                variant="primary"
                onClick={() => setIsFullscreenOpen(true)}
                icon={
                  <ArrowsPointingOutIcon
                    aria-hidden="true"
                    className="size-4"
                  />
                }
              >
                Afficher en plein écran
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<CreditCardIcon aria-hidden="true" className="size-7" />}
            title="Aucun code-barres"
            description="Ajoutez un code-barres en modifiant cette carte."
          />
        )}
      </section>

      {/* Members section */}
      {members.length > 0 && (
        <section aria-labelledby="members-heading" className="mb-6">
          <h2
            id="members-heading"
            className="mb-3 font-display text-xl font-bold text-ink dark:text-white"
          >
            Membres
            <span className="ml-2 text-sm font-normal text-ink-400 dark:text-ink-300">
              {members.length}
            </span>
          </h2>
          <ul
            className="divide-y divide-sand-200 rounded-card border border-sand-200 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-forest-900"
            role="list"
          >
            {members.map((member: LoyaltyCardMember) => {
              const memberName =
                member.profile?.display_name || member.user_id.slice(0, 8)
              return (
                <li
                  key={member.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {member.profile?.avatar_url ? (
                      <img
                        src={member.profile.avatar_url}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex size-8 items-center justify-center rounded-full bg-sand-100 text-xs font-medium text-ink-600 dark:bg-white/10 dark:text-ink-300">
                        {memberName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink dark:text-white">
                        {memberName}
                      </p>
                      <Badge variant={member.role === 'owner' ? 'forest' : 'neutral'}>
                        {ROLE_LABELS[member.role] ?? member.role}
                      </Badge>
                    </div>
                  </div>
                  {member.role !== 'owner' && isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        /* handled in ShareCardDialog */
                        setIsShareOpen(true)
                      }}
                      aria-label={`Gérer les membres`}
                      className="rounded-control p-1 text-ink-400 transition-colors hover:bg-sand-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-forest-400"
                    >
                      <UserGroupIcon aria-hidden="true" className="size-4" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Fullscreen barcode */}
      {isFullscreenOpen && (
        <LoyaltyCardFullscreen
          card={card}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}

      {/* Edit dialog */}
      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Modifier la carte"
        size="lg"
      >
        <LoyaltyCardForm
          card={card}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditOpen(false)}
          isPending={updateMutation.isPending}
        />
      </Modal>

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
          Voulez-vous vraiment supprimer la carte de « {card.store_name} » ?
          Tous les membres associés seront retirés. Cette action est
          irréversible.
        </p>
      </Modal>

      {/* Share dialog */}
      <ShareCardDialog
        open={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        cardId={card.id}
        members={members}
        currentUserId={user?.id ?? ''}
      />
    </div>
  )
}

export default LoyaltyCardDetailPage
