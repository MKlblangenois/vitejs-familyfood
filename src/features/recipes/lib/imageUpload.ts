import imageCompression from 'browser-image-compression'
import { supabase } from '../../../shared/lib/supabase'

// ============================================================
// Recipe image upload helpers.
//
// Images are stored in the public `recipe-images` bucket under the
// path `<user_id>/<recipe_id>/<timestamp>-<filename>`. Ownership is
// enforced by the storage RLS policies (first path segment = user id).
// ============================================================

const BUCKET = 'recipe-images'

/** Maximum accepted file size before compression (5 MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/** MIME types we accept for recipe images. */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/** Compression options applied to every uploaded image. */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1280,
  initialQuality: 0.8,
  useWebWorker: true,
}

/**
 * Validate that a file is a supported image and within the size limit.
 * Throws a descriptive error otherwise (Fail Fast).
 */
export function validateImageFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      'Unsupported file type. Please choose a JPEG, PNG, or WebP image.',
    )
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Image is too large. Please choose an image under 5 MB.')
  }
}

/**
 * Compress an image file to at most 1280px on its longest side and
 * ~500 KB. If compression fails for any reason, fall back to the
 * original file so the upload can still proceed.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    return await imageCompression(file, COMPRESSION_OPTIONS)
  } catch {
    return file
  }
}

/**
 * Upload a recipe image to Supabase Storage and return its public URL.
 *
 * The file is validated, compressed, then uploaded to
 * `<user_id>/<recipe_id>/<timestamp>-<filename>`. Throws a descriptive
 * error on any failure.
 */
export async function uploadRecipeImage(
  file: File,
  recipeId: string,
): Promise<string> {
  validateImageFile(file)

  if (!recipeId) {
    throw new Error('Recipe id is required to upload an image.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('You must be signed in to upload an image.')
  }

  const compressed = await compressImage(file)
  const timestamp = Date.now()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${recipeId}/${timestamp}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      contentType: compressed.type || file.type,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path)

  return publicUrlData.publicUrl
}

/**
 * Delete an object from the recipe-images bucket. Throws on failure.
 */
export async function deleteRecipeImage(path: string): Promise<void> {
  if (!path) {
    throw new Error('Image path is required to delete an image.')
  }

  const { error } = await supabase.storage.from(BUCKET).remove([path])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

/**
 * Extract the storage object path from a public URL.
 *
 * Public URLs look like
 * `<supabaseUrl>/storage/v1/object/public/recipe-images/<path>`.
 * Returns the `<path>` portion, or null if the URL isn't a recipe-images
 * public URL (e.g. an external image URL).
 */
export function extractStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const index = publicUrl.indexOf(marker)
  if (index === -1) return null
  return publicUrl.slice(index + marker.length)
}
