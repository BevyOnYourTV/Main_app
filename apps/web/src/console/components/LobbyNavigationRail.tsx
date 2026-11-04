import type { LucideIcon } from 'lucide-react'
import { SpatialLinkButton } from './SpatialLinkButton'

type LobbyNavigationRailProps = {
  focusKey: string
  icon: LucideIcon
  iconPosition?: 'start' | 'end'
  label: string
  to: string
}

export function LobbyNavigationRail({
  focusKey,
  icon,
  iconPosition,
  label,
  to,
}: LobbyNavigationRailProps) {
  return (
    <SpatialLinkButton
      focusKey={focusKey}
      icon={icon}
      iconPosition={iconPosition}
      label={label}
      size="rail"
      to={to}
      variant="menu"
    />
  )
}
