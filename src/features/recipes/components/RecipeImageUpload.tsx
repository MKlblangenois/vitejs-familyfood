import { useRef, useState } from 'react'
import { PhotoIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { uploadRecipeImage } from '../lib/imageUpload'

// ============================================================
// RecipeImageUpload — file picker with preview + upload.
//
// On selection the image is validated, compressed, and uploaded to
// Supabase Storage. The resulting public URL is reported via `onChange`.
// While uploading a spinner + "Uploading…" state is shown.
// ============================================================

interface RecipeImageUploadProps {
  /** Current image URL (pre-populated in edit mode). */
  value: string
  /** Called with the new public URL, or '' when the image is removed. */
  onChange: (url: string) => void
  /** Recipe id used to build the storage path. */
  recipeId?: string
  /** Optional error message to display. */
  error?: string
}

const RecipeImageUpload = ({
  value,
  onChange,
  recipeId,
  error,
}: RecipeImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    // Reset the input so selecting the same file again re-triggers change.
    event.target.value = ''
    if (!file) return

    if (!recipeId) {
      setUploadError(
        'La recette doit être enregistrée avant de pouvoir téléverser une image.',
      )
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const url = await uploadRecipeImage(file, recipeId)
      onChange(url)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Échec du téléversement de l’image.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    setUploadError(null)
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Image
      </span>

      <div className="mt-1">
        {value ? (
          <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
            <img
              src={value}
              alt="Aperçu de la recette"
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="absolute right-2 top-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                aria-label="Remplacer l’image"
                className="inline-flex items-center justify-center rounded-full bg-gray-950/60 p-1.5 text-white transition-colors hover:bg-gray-950/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowPathIcon aria-hidden="true" className="size-4" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                aria-label="Supprimer l’image"
                className="inline-flex items-center justify-center rounded-full bg-gray-950/60 p-1.5 text-white transition-colors hover:bg-gray-950/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XMarkIcon aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-gray-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400 dark:focus-visible:outline-indigo-500"
          >
            <PhotoIcon aria-hidden="true" className="size-8" />
            <span className="text-sm font-medium">
              {isUploading ? 'Téléversement…' : 'Choisir une image'}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              JPEG, PNG ou WebP · jusqu&apos;à 5 Mo
            </span>
          </button>
        )}

        {/* Uploading spinner overlay */}
        {isUploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="size-4 animate-spin rounded-full border-2 border-indigo-600/30 border-t-indigo-600 dark:border-indigo-400/30 dark:border-t-indigo-400" />
            Téléversement…
          </div>
        )}
      </div>

      {/* Error message */}
      {(uploadError || error) && (
        <p
          role="alert"
          className="mt-1 text-sm text-red-600 dark:text-red-400"
        >
          {uploadError ?? error}
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => void handleFileChange(e)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}

export default RecipeImageUpload
