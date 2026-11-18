import { useCallback, useLayoutEffect, useRef } from 'react'
import type { Ref, TextareaHTMLAttributes } from 'react'

function resize(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`
}

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  ref?: Ref<HTMLTextAreaElement>
}

export default function AutoResizeTextarea({ ref, onInput, ...props }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const setRef = useCallback(
    (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element
      if (typeof ref === 'function') ref(element)
      else if (ref) ref.current = element
    },
    [ref],
  )

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    resize(textarea)
    if (typeof ResizeObserver === 'undefined') return
    let width = textarea.clientWidth
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth !== width) {
        width = textarea.clientWidth
        resize(textarea)
      }
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [])

  return (
    <textarea
      {...props}
      ref={setRef}
      onInput={(event) => {
        resize(event.currentTarget)
        onInput?.(event)
      }}
    />
  )
}
