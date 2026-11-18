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
import BrandMark from '../../../shared/components/BrandMark'

// ============================================================
// Sub-components
// ============================================================

function CardsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-card border-sand-200 bg-sand-200 aspect-square animate-pulse overflow-hidden border dark:border-white/10 dark:bg-white/10"
        />
      ))}
    </div>
  )
}

// ============================================================
// Main component
// ============================================================

const LoyaltyCardsPage = () => {
  const { data: cards, isLoading, isError, refetch } = useLoyaltyCards()
  const createMutation = useCreateLoyaltyCard()

  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null)

  const filteredCards = useMemo(() => {
    if (!cards) return []
    if (!search.trim()) return cards
    const query = search.trim().toLowerCase()
    return cards.filter((c) => c.store_name.toLowerCase().includes(query))
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
      <header className="relative mb-8 overflow-hidden pt-14 sm:mb-12 sm:pt-16">
        <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
          Toujours à portée de main
        </p>
        <h1 className="font-display text-forest dark:text-cream relative z-10 mt-5 max-w-[14ch] text-[clamp(2.8rem,8vw,4.75rem)] leading-[1.08] font-medium tracking-[-0.04em]">
          <span className="sr-only">Cartes de fidélité : </span>Vos cartes,
          <br />
          <span className="text-sage-400 dark:text-sage-300 font-normal italic">
            bien gardées.
          </span>
        </h1>
        <p className="text-ink-500 dark:text-ink-300 mt-5 max-w-md text-sm/6 sm:text-base">
          Toutes vos cartes de fidélité réunies au même endroit.
        </p>
        <BrandMark className="text-sage-100 pointer-events-none absolute top-14 right-0 size-14 sm:top-16 sm:right-8 sm:size-28 dark:text-white/10" />
        <Button
          variant="primary"
          icon={<PlusIcon aria-hidden="true" className="size-5" />}
          onClick={openCreateDialog}
          className="relative mt-6 min-h-11"
        >
          Nouvelle carte
        </Button>
      </header>

      {/* Search — only show when there are cards or loading */}
      {!isError && (
        <div className="relative mb-6">
          <label htmlFor="card-search" className="sr-only">
            Rechercher des cartes de fidélité
          </label>
          <MagnifyingGlassIcon
            aria-hidden="true"
            className="text-ink-400 dark:text-ink-300 pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          />
          <input
            id="card-search"
            type="text"
            placeholder="Rechercher des cartes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-control border-sand-200 text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-forest-500 focus:outline-forest-600 dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 block w-full border bg-white py-3 pr-4 pl-11 text-sm focus:ring-1 focus:outline-2 focus:outline-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-white"
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

      {!isLoading && !isError && cards?.length === 0 && (
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
        <section aria-labelledby="cards-heading">
          <p className="text-forest-600 dark:text-sage-300 text-[10px] font-bold tracking-[0.2em] uppercase">
            Votre portefeuille
          </p>
          <h2
            id="cards-heading"
            className="font-display text-ink mt-2 mb-6 text-2xl font-medium tracking-tight sm:text-3xl dark:text-white"
          >
            Vos cartes de fidélité
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {filteredCards.map((card) => (
              <LoyaltyCardItem
                key={card.id}
                card={card}
                onClick={setSelectedCard}
              />
            ))}
          </div>
        </section>
      )}

      {/* No results for search */}
      {!isLoading &&
        !isError &&
        cards &&
        cards.length > 0 &&
        filteredCards.length === 0 && (
          <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
            <div className="bg-sand-100 text-ink-400 dark:text-ink-300 flex size-14 items-center justify-center rounded-full dark:bg-white/10">
              <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
            </div>
            <p className="text-ink-500 dark:text-ink-300 mt-4 text-sm/6">
              Aucune carte ne correspond à « {search} »
            </p>
          </div>
        )}

      {/* Create card dialog */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nouvelle carte de fidélité"
        size="lg"
      >
        {createMutation.isError && (
          <p
            role="alert"
            className="text-error-600 dark:text-error-400 mb-4 text-sm"
          >
            Impossible de créer la carte. Veuillez réessayer.
          </p>
        )}
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
