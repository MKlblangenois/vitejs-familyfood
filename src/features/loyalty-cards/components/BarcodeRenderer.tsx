import { useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import JsBarcode from 'jsbarcode'

// Map our barcode format constants to the format strings JsBarcode expects
const JSBARCODE_FORMAT_MAP: Record<string, string> = {
  EAN_13: 'EAN13',
  EAN_8: 'EAN8',
  CODE_128: 'CODE128',
  CODE_39: 'CODE39',
  UPC_A: 'UPC',
  UPC_E: 'UPCE',
}

interface BarcodeRendererProps {
  value: string
  format: string | null
  className?: string
}

const BarcodeRenderer = ({ value, format, className }: BarcodeRendererProps) => {
  const svgRef = useRef<SVGSVGElement>(null)

  const isQRCode = format === 'QR_CODE'
  const jsbarcodeFormat = format ? JSBARCODE_FORMAT_MAP[format] : undefined
  const isBarcode = !!jsbarcodeFormat

  useEffect(() => {
    if (!isBarcode || !svgRef.current || !value) return

    try {
      JsBarcode(svgRef.current, value, {
        format: jsbarcodeFormat,
        displayValue: true,
        height: 100,
        margin: 8,
        fontSize: 14,
        font: 'monospace',
      })
    } catch {
      // Invalid barcode value for the given format — fail silently
    }
  }, [value, jsbarcodeFormat, isBarcode])

  if (!value || !format) return null

  if (isQRCode) {
    return (
      <div className={className}>
        <QRCodeSVG
          value={value}
          size={200}
          bgColor="white"
          fgColor="#1a1a1a"
          level="M"
          aria-label={`Code QR : ${value}`}
        />
      </div>
    )
  }

  if (isBarcode) {
    return (
      <div className={className}>
        <svg
          ref={svgRef}
          aria-label={`Code-barres : ${value}`}
          className="w-full max-w-xs"
        />
      </div>
    )
  }

  return null
}

export default BarcodeRenderer
