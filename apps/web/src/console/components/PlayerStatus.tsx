import { cn } from '@/lib/utils'

export type PlayerConnectionStatus =
  | 'Connected'
  | 'Connecting'
  | 'Disconnected'

const statusStyles: Record<PlayerConnectionStatus, string> = {
  Connected: 'border-primary/50 bg-primary/15 text-primary-foreground',
  Connecting: 'border-chart-5/60 bg-chart-5/15 text-air-foreground',
  Disconnected:
    'border-destructive/60 bg-destructive/15 text-air-foreground',
}

type PlayerStatusProps = {
  status: PlayerConnectionStatus
}

export function PlayerStatus({ status }: PlayerStatusProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold',
        statusStyles[status],
      )}
    >
      {status}
    </span>
  )
}
