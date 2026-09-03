import { useState, useCallback } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../../shared/lib/supabase'
import { useAddCardMember, useRemoveCardMember } from '../hooks'
import type { LoyaltyCardMember } from '../types'
import { ROLE_LABELS } from '../lib/roleLabels'
import Button from '../../../shared/components/Button'
import Modal from '../../../shared/components/Modal'
import Badge from '../../../shared/components/Badge'

interface ShareCardDialogProps {
  open: boolean
  onClose: () => void
  cardId: string
  members: LoyaltyCardMember[]
  currentUserId: string
}

const ShareCardDialog = ({
  open,
  onClose,
  cardId,
  members,
  currentUserId,
}: ShareCardDialogProps) => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addMemberMutation = useAddCardMember()
  const removeMemberMutation = useRemoveCardMember()

  const handleAddMember = useCallback(async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    setError(null)

    // Look up user ID by email via RPC
    const { data: userId, error: lookupError } = await supabase.rpc(
      'lookup_user_by_email',
      { lookup_email: trimmed },
    )

    if (lookupError) {
      setError('Erreur lors de la recherche utilisateur.')
      return
    }

    if (!userId) {
      setError('Aucun utilisateur trouvé avec cet email.')
      return
    }

    if (userId === currentUserId) {
      setError('Vous ne pouvez pas vous ajouter vous-même.')
      return
    }

    addMemberMutation.mutate(
      { card_id: cardId, user_id: userId as string },
      {
        onSuccess: () => {
          setEmail('')
          setError(null)
        },
        onError: (err) => {
          setError(err.message || 'Échec de l\'ajout du membre.')
        },
      },
    )
  }, [email, cardId, currentUserId, addMemberMutation])

  const handleRemoveMember = useCallback(
    (member: LoyaltyCardMember) => {
      removeMemberMutation.mutate({
        card_id: cardId,
        user_id: member.user_id,
      })
    },
    [cardId, removeMemberMutation],
  )

  const handleClose = useCallback(() => {
    setEmail('')
    setError(null)
    onClose()
  }, [onClose])

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Partager la carte"
      footer={
        <Button variant="secondary" onClick={handleClose}>
          Terminé
        </Button>
      }
    >
      <p className="text-sm/6 text-ink-500 dark:text-ink-300">
        Entrez l&apos;email d&apos;un utilisateur pour lui donner accès à cette carte.
      </p>

      {/* Add member form */}
      <div className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddMember()
          }}
          placeholder="email@exemple.com"
          aria-label="Email de l'utilisateur à ajouter"
          className="min-w-0 flex-1 rounded-control border border-sand-200 bg-white px-3 py-2 text-sm text-ink shadow-soft placeholder:text-ink-400 focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-ink-300 dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddMember}
          isLoading={addMemberMutation.isPending}
          disabled={addMemberMutation.isPending || !email.trim()}
        >
          {addMemberMutation.isPending ? undefined : 'Ajouter'}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-error dark:text-error-400">
          {error}
        </p>
      )}

      {/* Current members */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-ink-700 dark:text-ink-200">
          Membres actuels
        </h3>
        <ul
          className="mt-2 divide-y divide-sand-200 dark:divide-white/10"
          role="list"
        >
          {members.map((member) => {
            const memberName =
              member.profile?.display_name || member.user_id.slice(0, 8)
            const isOwner = member.role === 'owner'

            return (
              <li
                key={member.id}
                className="flex items-center justify-between py-2.5"
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
                      {member.profile?.display_name || `${memberName}…`}
                    </p>
                    <Badge variant={isOwner ? 'forest' : 'neutral'}>
                      {ROLE_LABELS[member.role] ?? member.role}
                    </Badge>
                  </div>
                </div>
                {!isOwner && member.user_id === currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={removeMemberMutation.isPending}
                    aria-label="Quitter cette carte"
                    className="rounded-control p-1 text-ink-400 transition-colors hover:bg-error-50 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500"
                  >
                    <XMarkIcon aria-hidden="true" className="size-4" />
                  </button>
                )}
                {!isOwner &&
                  member.user_id !== currentUserId &&
                  members.some(
                    (m) =>
                      m.user_id === currentUserId && m.role === 'owner',
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member)}
                      disabled={removeMemberMutation.isPending}
                      aria-label={`Retirer ${memberName}`}
                      className="rounded-control p-1 text-ink-400 transition-colors hover:bg-error-50 hover:text-error focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-ink-300 dark:hover:bg-error-500/10 dark:hover:text-error-400 dark:focus-visible:outline-error-500"
                    >
                      <XMarkIcon aria-hidden="true" className="size-4" />
                    </button>
                  )}
              </li>
            )
          })}
        </ul>
      </div>
    </Modal>
  )
}

export default ShareCardDialog
