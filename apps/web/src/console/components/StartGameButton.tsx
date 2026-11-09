import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import { Button } from '@/components/ui/button'

export function StartGameButton() {
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    accessibilityLabel: 'Start or resume game',
    focusKey: 'GAME_LOBBY_START',
  })

  return (
    <Button
      ref={ref}
      className="tv-spatial-button"
      data-spatial-focused={focused}
      size="gameLobbyAction"
      type="button"
    >
      Start / Resume game
    </Button>
  )
}
