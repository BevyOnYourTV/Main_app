import { useFocusable } from '@noriginmedia/norigin-spatial-navigation-react'
import { Button } from '@/components/ui/button'

type LobbyActionButtonProps = {
  focusKey: string
  label: string
  playerName: string
}

export function LobbyActionButton({
  focusKey,
  label,
  playerName,
}: LobbyActionButtonProps) {
  const accessibleLabel = `${label} ${playerName}`
  const { ref, focused } = useFocusable<object, HTMLButtonElement>({
    accessibilityLabel: accessibleLabel,
    focusKey,
  })

  return (
    <Button
      ref={ref}
      aria-label={accessibleLabel}
      className="tv-spatial-button w-full"
      data-spatial-focused={focused}
      type="button"
      variant="secondary"
    >
      {label}
    </Button>
  )
}
