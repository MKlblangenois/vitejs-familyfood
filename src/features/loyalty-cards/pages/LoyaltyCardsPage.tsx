import { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import {
  useLoyaltyCards,
  useCreateLoyaltyCard,
  useUpdateLoyaltyCard,
  useDeleteLoyaltyCard,
} from '../hooks'
import type { LoyaltyCard } from '../types'
import LoyaltyCardItem from '../components/LoyaltyCardItem'
import LoyaltyCardForm from '../components/LoyaltyCardForm'
import Button from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import EmptyState from '../../../shared/components/EmptyState'
import ErrorState from '../../../shared/components/ErrorState'

// ============================================================
// Sub-components
// ============================================================

function CardsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-card border border-sand-200 bg-sand-200 dark:border-white/10 dark:bg-white/10"
        >
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <div className="size-10 animate-pulse rounded-control bg-white/20" />
              <div className="h-4 w-3/4 animate-pulse rounded-control bg-white/20" />
            </div>
            <div className="h-3 w-1/2 animate-pulse rounded-control bg-white/20" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const LoyaltyCardsPage = () => {
  const {
    data: cards,
    isLoading,
    isError,
    refetch,
  } = useLoyaltyCards()
  const createMutation = useCreateLoyaltyCard()
  const updateMutation = useUpdateLoyaltyCard()
  const deleteMutation = useDeleteLoyaltyCard()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<LoyaltyCard | null>(null)
  const [deletingCard, setDeletingCard] = useState<LoyaltyCard | null>(null)

  const filteredCards = useMemo(() => {
    if (!cards) return []
    if (!search.trim()) return cards
    const query = search.trim().toLowerCase()
    return cards.filter((c) =>
      c.store_name.toLowerCase().includes(query),
    )
  }, [cards, search])

  const openCreateDialog = useCallback(() => {
    setEditingCard(null)
    setIsCreateOpen(true)
  }, [])

  const handleCreate = useCallback(
    (data: {
      store_name: string
      barcode_value: string | null
      barcode_format: string | null
      card_color: string
    }) => {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsCreateOpen(false)
        },
      })
    },
    [createMutation],
  )

  const handleUpdate = useCallback(
    (data: {
      store_name: string
      barcode_value: string | null
      barcode_format: string | null
      card_color: string
    }) => {
      if (!editingCard) return
      updateMutation.mutate(
        {
          id: editingCard.id,
          ...data,
        },
        { onSuccess: () => setEditingCard(null) },
      )
    },
    [editingCard, updateMutation],
  )

  const handleDelete = useCallback(() => {
    if (!deletingCard) return
    deleteMutation.mutate(deletingCard.id, {
      onSuccess: () => setDeletingCard(null),
    })
  }, [deletingCard, deleteMutation])

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold text-ink dark:text-white sm:text-4xl">
          Cartes de fidélité
        </h1>

        <Button
          variant="primary"
          icon={<PlusIcon aria-hidden="true" className="size-5" />}
          onClick={openCreateDialog}
        >
          Nouvelle carte
        </Button>
      </div>

      {/* Search — only show when there are cards or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="card-search" className="sr-only">
            Rechercher des cartes de fidélité
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400 dark:text-ink-300"
          />
          <input
            id="card-search"
            type="text"
            placeholder="Rechercher des cartes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-control border border-sand-200 bg-cream py-3 pl-11 pr-4 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
          />
        </div>
      )}

      {/* Content */}
      {isLoading && <CardsLoadingSkeleton />}

      {isError && (
        <ErrorState
          title="Une erreur est survenue"
          description="Nous n'avons pas pu charger vos cartes de fidélité. Veuillez vérifier votre connexion et réessayer."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && filteredCards.length === 0 && (
        <EmptyState
          icon={<CreditCardIcon aria-hidden="true" className="size-7" />}
          title="Aucune carte de fidélité pour le moment"
          description="Ajoutez vos cartes de fidélité pour les avoir toujours à portée de main."
          action={
            <Button
              variant="primary"
              icon={<PlusIcon aria-hidden="true" className="size-5" />}
              onClick={openCreateDialog}
            >
              Ajouter votre première carte
            </Button>
          }
        />
      )}

      {!isLoading && !isError && filteredCards.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => (
            <LoyaltyCardItem key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* No results for search */}
      {!isLoading &&
        !isError &&
        cards &&
        cards.length > 0 &&
        filteredCards.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-400 dark:bg-white/10 dark:text-ink-300">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="mt-4 text-sm/6 text-ink-500 dark:text-ink-300">
              Aucune carte ne correspond à « {search} »
            </p>
          </div>
        )}

      {/* Mobile FAB */}
      <Button
        variant="primary"
        aria-label="Nouvelle carte"
        onClick={openCreateDialog}
        icon={<PlusIcon aria-hidden="true" className="size-6" />}
        className="fixed bottom-20 right-5 z-30 flex size-14 !rounded-full !p-0 shadow-float transition-transform hover:scale-105 sm:hidden"
      />

      {/* Create card dialog */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle carte de fidélité"
        size="lg"
      >
        <LoyaltyCardForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isPending={createMutation.isPending}
        />
      </Modal>

      {/* Edit card dialog */}
      <Modal
        open={editingCard !== null}
        onClose={() => setEditingCard(null)}
        title="Modifier la carte"
        size="lg"
      >
        <LoyaltyCardForm
          card={editingCard}
          onSubmit={handleUpdate}
          onCancel={() => setEditingCard(null)}
          isPending={updateMutation.isPending}
        />
      </Modal>

      {/* Delete card confirmation dialog */}
      <Modal
        open={deletingCard !== null}
        onClose={() => setDeletingCard(null)}
        title="Supprimer la carte ?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeletingCard(null)}
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
          Voulez-vous vraiment supprimer la carte de « {deletingCard?.store_name} » ?
          Cette action est irréversible.
        </p>
      </Modal>
    </div>
  )
}

export default LoyaltyCardsPage
