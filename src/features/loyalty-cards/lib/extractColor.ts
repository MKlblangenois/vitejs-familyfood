/**
 * Extract the dominant color from an image URL using a canvas.
 * Returns a hex color string like "#1f3a2e".
 */
export async function extractDominantColor(
  imageUrl: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas not supported'))

      // Sample at small size for performance
      const size = 10
      canvas.width = size
      canvas.height = size
      ctx.drawImage(img, 0, 0, size, size)

      const imageData = ctx.getImageData(0, 0, size, size).data
      let r = 0,
        g = 0,
        b = 0,
        count = 0

      // Sample every 4th pixel
      for (let i = 0; i < imageData.length; i += 16) {
        r += imageData[i]
        g += imageData[i + 1]
        b += imageData[i + 2]
        count++
      }

      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)

      // Darken slightly for better contrast with white text
      const darken = 0.7
      r = Math.round(r * darken)
      g = Math.round(g * darken)
      b = Math.round(b * darken)

      resolve(
        `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
