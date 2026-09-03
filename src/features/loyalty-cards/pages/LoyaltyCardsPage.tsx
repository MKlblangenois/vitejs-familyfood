import { useState, useCallback, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import { useLoyaltyCards, useCreateLoyaltyCard } from '../hooks'
import type { LoyaltyCard } from '../types'
import LoyaltyCardItem from '../components/LoyaltyCardItem'
import LoyaltyCardBottomSheet from '../components/LoyaltyCardBottomSheet'
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse overflow-hidden rounded-card border border-sand-200 bg-sand-200 dark:border-white/10 dark:bg-white/10"
        />
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

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null)

  const filteredCards = useMemo(() => {
    if (!cards) return []
    if (!search.trim()) return cards
    const query = search.trim().toLowerCase()
    return cards.filter((c) =>
      c.store_name.toLowerCase().includes(query),
    )
  }, [cards, search])

  const openCreateDialog = useCallback(() => {
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredCards.map((card) => (
            <LoyaltyCardItem
              key={card.id}
              card={card}
              onClick={setSelectedCard}
            />
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

      {/* Card bottom sheet */}
      <LoyaltyCardBottomSheet
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  )
}

export default LoyaltyCardsPage
