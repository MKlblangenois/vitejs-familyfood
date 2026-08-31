import { describe, it, expect, beforeEach, vi } from 'vitest'
import imageCompression from 'browser-image-compression'
import {
  compressImage,
  uploadRecipeImage,
  deleteRecipeImage,
  validateImageFile,
} from '../imageUpload'
import { mockSupabaseStorage } from '../../../../test/supabaseMock'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  storage: { from: vi.fn() },
  auth: { getUser: vi.fn() },
}))

vi.mock('../../../../shared/lib/supabase', () => ({
  supabase: {
    from: mocks.from,
    storage: mocks.storage,
    auth: mocks.auth,
  },
}))

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFile(name = 'photo.jpg', type = 'image/jpeg', size = 1000): File {
  return new File(['x'.repeat(size)], name, { type })
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  })
})

// ===========================================================================
// validateImageFile
// ===========================================================================

describe('validateImageFile', () => {
  it('accepts a valid image under the size limit', () => {
    expect(() => validateImageFile(makeFile())).not.toThrow()
  })

  it('rejects a non-image file type', () => {
    expect(() => validateImageFile(makeFile('doc.pdf', 'application/pdf'))).toThrow(
      'Unsupported file type',
    )
  })

  it('rejects a file over 5 MB', () => {
    const big = makeFile('big.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1)
    expect(() => validateImageFile(big)).toThrow('too large')
  })
})

// ===========================================================================
// compressImage
// ===========================================================================

describe('compressImage', () => {
  it('calls browser-image-compression with the file and compression options', async () => {
    const file = makeFile()
    const compressed = makeFile('compressed.jpg')
    vi.mocked(imageCompression).mockResolvedValue(compressed)

    const result = await compressImage(file)

    expect(imageCompression).toHaveBeenCalledWith(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1280,
      initialQuality: 0.8,
      useWebWorker: true,
    })
    expect(result).toBe(compressed)
  })

  it('falls back to the original file when compression fails', async () => {
    const file = makeFile()
    vi.mocked(imageCompression).mockRejectedValue(new Error('compression boom'))

    const result = await compressImage(file)

    expect(result).toBe(file)
  })
})

// ===========================================================================
// uploadRecipeImage
// ===========================================================================

describe('uploadRecipeImage', () => {
  it('uploads to the correct path and returns the public URL', async () => {
    const { bucket } = mockSupabaseStorage(mocks.storage)
    bucket('recipe-images').setPublicUrl('https://cdn.example.com/photo.jpg')
    vi.mocked(imageCompression).mockResolvedValue(makeFile('compressed.jpg'))

    const file = makeFile('my photo.jpg')
    const url = await uploadRecipeImage(file, 'recipe-1')

    const uploadCall = bucket('recipe-images').upload.mock.calls[0]
    const [path, uploadedFile, options] = uploadCall

    expect(path).toMatch(/^user-1\/recipe-1\/\d+-my_photo\.jpg$/)
    expect(uploadedFile).toBeInstanceOf(File)
    expect(options).toEqual({
      contentType: 'image/jpeg',
      upsert: false,
    })
    expect(bucket('recipe-images').getPublicUrl).toHaveBeenCalledWith(path)
    expect(url).toBe('https://cdn.example.com/photo.jpg')
  })

  it('throws when the user is not authenticated', async () => {
    mocks.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })

    await expect(uploadRecipeImage(makeFile(), 'recipe-1')).rejects.toThrow(
      'signed in',
    )
  })

  it('throws on upload failure', async () => {
    const { bucket } = mockSupabaseStorage(mocks.storage)
    bucket('recipe-images').setUploadResult({
      data: null,
      error: { message: 'upload boom' },
    })
    vi.mocked(imageCompression).mockResolvedValue(makeFile('compressed.jpg'))

    await expect(uploadRecipeImage(makeFile(), 'recipe-1')).rejects.toThrow(
      'Failed to upload image: upload boom',
    )
  })

  it('throws on invalid file type before uploading', async () => {
    const { bucket } = mockSupabaseStorage(mocks.storage)

    await expect(
      uploadRecipeImage(makeFile('doc.pdf', 'application/pdf'), 'recipe-1'),
    ).rejects.toThrow('Unsupported file type')

    expect(bucket('recipe-images').upload).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// deleteRecipeImage
// ===========================================================================

describe('deleteRecipeImage', () => {
  it('calls remove with the given path', async () => {
    const { bucket } = mockSupabaseStorage(mocks.storage)

    await deleteRecipeImage('user-1/recipe-1/123-photo.jpg')

    expect(bucket('recipe-images').remove).toHaveBeenCalledWith([
      'user-1/recipe-1/123-photo.jpg',
    ])
  })

  it('throws on remove failure', async () => {
    const { bucket } = mockSupabaseStorage(mocks.storage)
    bucket('recipe-images').setRemoveResult({
      data: null,
      error: { message: 'remove boom' },
    })

    await expect(deleteRecipeImage('user-1/recipe-1/123-photo.jpg')).rejects.toThrow(
      'Failed to delete image: remove boom',
    )
  })

  it('throws when no path is provided', async () => {
    await expect(deleteRecipeImage('')).rejects.toThrow(
      'Image path is required',
    )
  })
})
