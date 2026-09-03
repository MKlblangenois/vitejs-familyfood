import { useState, useMemo, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  CameraIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline'
import { getStoreLogoUrl } from '../lib/logo'
import { DEFAULT_CARD_COLORS } from '../lib/logo'
import { BARCODE_FORMATS } from '../types'
import type { LoyaltyCard } from '../types'
import Button from '../../../shared/components/Button'
import TextField from '../../../shared/components/TextField'
import BarcodeScanner from './BarcodeScanner'

const barcodeFormatEntries = Object.entries(BARCODE_FORMATS) as [
  string,
  string,
][]

const cardFormSchema = z.object({
  store_name: z
    .string()
    .min(1, 'Le nom du magasin est requis')
    .max(100, 'Le nom est trop long'),
  barcode_value: z.string().max(200).optional().or(z.literal('')),
  barcode_format: z.string().optional().or(z.literal('')),
  card_color: z.string().min(1),
})

type CardFormData = z.infer<typeof cardFormSchema>

interface LoyaltyCardFormProps {
  /** Pass an existing card to edit, or omit to create. */
  card?: LoyaltyCard | null
  onSubmit: (data: {
    store_name: string
    barcode_value: string | null
    barcode_format: string | null
    card_color: string
  }) => void
  onCancel: () => void
  isPending?: boolean
}

const LoyaltyCardForm = ({
  card,
  onSubmit,
  onCancel,
  isPending = false,
}: LoyaltyCardFormProps) => {
  const [showScanner, setShowScanner] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CardFormData>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      store_name: card?.store_name ?? '',
      barcode_value: card?.barcode_value ?? '',
      barcode_format: card?.barcode_format ?? '',
      card_color: card?.card_color ?? DEFAULT_CARD_COLORS[0],
    },
  })

  const storeName = watch('store_name')
  const selectedColor = watch('card_color')

  const logoPreviewUrl = useMemo(
    () => (storeName.trim() ? getStoreLogoUrl(storeName.trim(), 64) : null),
    [storeName],
  )

  const handleFormSubmit = useCallback(
    (data: CardFormData) => {
      onSubmit({
        store_name: data.store_name.trim(),
        barcode_value: data.barcode_value?.trim() || null,
        barcode_format: data.barcode_format || null,
        card_color: data.card_color,
      })
    },
    [onSubmit],
  )

  const handleScan = useCallback(
    (decodedText: string, format: string) => {
      setValue('barcode_value', decodedText)
      // Map the Html5Qrcode format name back to our format constant
      const formatMap: Record<string, string> = {
        QR_CODE: 'QR_CODE',
        EAN_13: 'EAN_13',
        EAN_8: 'EAN_8',
        CODE_128: 'CODE_128',
        CODE_39: 'CODE_39',
        UPC_A: 'UPC_A',
        UPC_E: 'UPC_E',
      }
      const mappedFormat = formatMap[format] ?? format
      if (mappedFormat in BARCODE_FORMATS) {
        setValue('barcode_format', mappedFormat)
      }
      setShowScanner(false)
    },
    [setValue],
  )

  return (
    <div>
      {showScanner ? (
        <div className="space-y-4">
          <BarcodeScanner
            onScan={handleScan}
            onCancel={() => setShowScanner(false)}
          />
          <Button
            variant="secondary"
            onClick={() => setShowScanner(false)}
            className="w-full"
          >
            Annuler le scan
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <div className="space-y-4">
            {/* Store name + logo preview */}
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <TextField
                  id="card-store-name"
                  label="Nom du magasin"
                  placeholder="p. ex. Carrefour, Leclerc…"
                  error={errors.store_name?.message}
                  autoFocus
                  {...register('store_name')}
                />
              </div>
              {logoPreviewUrl && (
                <div className="mb-0.5 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-control border border-sand-200 bg-white dark:border-white/10 dark:bg-white/5">
                  <img
                    src={logoPreviewUrl}
                    alt="Aperçu du logo"
                    className="size-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Barcode value + scan button */}
            <div>
              <TextField
                id="card-barcode-value"
                label="Valeur du code-barres"
                placeholder="p. ex. 1234567890"
                error={errors.barcode_value?.message}
                {...register('barcode_value')}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 transition-colors hover:text-forest-700 dark:text-forest-300 dark:hover:text-forest-200"
              >
                <CameraIcon aria-hidden="true" className="size-4" />
                Scanner un code-barres
              </button>
            </div>

            {/* Barcode format */}
            <div>
              <label
                htmlFor="card-barcode-format"
                className="block text-sm font-medium text-ink-700 dark:text-ink-200"
              >
                Format du code-barres
              </label>
              <select
                id="card-barcode-format"
                {...register('barcode_format')}
                className="mt-1 block w-full rounded-control border border-sand-200 bg-cream px-3 py-2 text-ink shadow-soft focus:border-forest-500 focus:ring-1 focus:ring-forest-500 focus:outline-2 focus:outline-offset-2 focus:outline-forest-600 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-forest-400 dark:focus:ring-forest-400 dark:focus:outline-forest-400 sm:text-sm/6"
              >
                <option value="">Aucun</option>
                {barcodeFormatEntries.map(([key, value]) => (
                  <option key={key} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            {/* Card color swatches */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-700 dark:text-ink-200">
                <SwatchIcon aria-hidden="true" className="size-4" />
                Couleur de la carte
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CARD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue('card_color', color)}
                    aria-label={`Couleur ${color}`}
                    className={`size-9 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600 ${
                      selectedColor === color
                        ? 'border-white scale-110 shadow-lg ring-2 ring-white ring-offset-2 ring-offset-cream dark:ring-forest-900 dark:ring-offset-forest-900'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                disabled={isPending || !storeName.trim()}
              >
                {isPending
                  ? card
                    ? 'Enregistrement…'
                    : 'Création…'
                  : card
                    ? 'Enregistrer'
                    : 'Créer la carte'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default LoyaltyCardForm
