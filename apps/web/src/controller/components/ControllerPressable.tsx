import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'

type ControllerPressableProps = {
  ariaLabel?: string
  children: ReactNode
  onPress: () => void
  onRelease: () => void
}

/**
 * Reports press and release for held controls. Keyboards and screen readers
 * only produce a click, which is reported as a press followed by a release.
 */
export function ControllerPressable({
  ariaLabel,
  children,
  onPress,
  onRelease,
}: ControllerPressableProps) {
  const isHeld = useRef(false)
  const startedWithPointer = useRef(false)

  const handlePointerDown = () => {
    isHeld.current = true
    startedWithPointer.current = true
    onPress()
  }

  const handlePointerUp = () => {
    if (isHeld.current) {
      isHeld.current = false
      onRelease()
    }
  }

  const handlePointerAbort = () => {
    if (isHeld.current) {
      startedWithPointer.current = false
      handlePointerUp()
    }
  }

  const handleClick = () => {
    if (startedWithPointer.current) {
      startedWithPointer.current = false
      return
    }
    onPress()
    onRelease()
  }

  return (
    <Button
      aria-label={ariaLabel}
      onClick={handleClick}
      onPointerCancel={handlePointerAbort}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerAbort}
      onPointerUp={handlePointerUp}
      size="controller"
      type="button"
    >
      {children}
    </Button>
  )
}
