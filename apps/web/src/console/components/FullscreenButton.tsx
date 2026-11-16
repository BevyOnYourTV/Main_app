import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import { MaximizeIcon, MinimizeIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement),
  )
  const isSupported =
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function'
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    accessibilityLabel: label,
    focusKey: 'SETTINGS_FULLSCREEN',
    focusable: isSupported,
    onEnterPress: () => ref.current?.click(),
  })

  useEffect(() => {
    const updateFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    document.addEventListener('fullscreenchange', updateFullscreenState)

    return () => {
      document.removeEventListener('fullscreenchange', updateFullscreenState)
    }
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await document.documentElement.requestFullscreen()
  }

  const Icon = isFullscreen ? MinimizeIcon : MaximizeIcon

  return (
    <Button
      ref={ref}
      aria-pressed={isFullscreen}
      className="tv-spatial-button"
      data-spatial-focused={focused}
      disabled={!isSupported}
      onClick={() => void toggleFullscreen()}
      size="lg"
      type="button"
    >
      <Icon aria-hidden="true" data-icon="inline-start" />
      {label}
    </Button>
  )
}
