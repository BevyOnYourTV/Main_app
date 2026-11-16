import { SpatialLinkButton } from './SpatialLinkButton'

type MainMenuCardProps = {
  focusKey: string
  label: string
  to: string
}

export function MainMenuCard({ focusKey, label, to }: MainMenuCardProps) {
  return (
    <SpatialLinkButton
      focusKey={focusKey}
      label={label}
      size="menu"
      to={to}
      variant="menu"
    />
  )
}
