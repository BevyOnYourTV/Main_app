import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import { Button } from '@/components/ui/button'
import type { GameSummary } from '../data/gameCatalog'

type GameSelectionButtonProps = {
  focusKey: string
  game: GameSummary
  isSelected: boolean
  onPlay: (game: GameSummary) => void
  onSelect: (game: GameSummary) => void
}

export function GameSelectionButton({
  focusKey,
  game,
  isSelected,
  onPlay,
  onSelect,
}: GameSelectionButtonProps) {
  const label = isSelected ? `Play ${game.name}` : game.name
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    accessibilityLabel: label,
    focusKey,
    onEnterPress: () => {
      if (isSelected) {
        ref.current?.click()
      }
    },
    onFocus: () => {
      onSelect(game)
      ref.current?.scrollIntoView({ block: 'nearest' })
    },
  })

  return (
    <Button
      ref={ref}
      aria-label={label}
      className="tv-spatial-button"
      data-spatial-focused={focused}
      onClick={() => {
        if (isSelected) {
          onPlay(game)
        }
      }}
      onFocus={() => onSelect(game)}
      onMouseEnter={() => onSelect(game)}
      size="game"
      type="button"
      variant={isSelected ? 'default' : 'secondary'}
    >
      {isSelected ? 'Play' : game.name}
    </Button>
  )
}
