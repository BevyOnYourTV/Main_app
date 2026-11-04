import { QrCodeIcon } from 'lucide-react'

type LobbyJoinDetailsProps = {
  roomCode: string
}

export function LobbyJoinDetails({ roomCode }: LobbyJoinDetailsProps) {
  return (
    <aside aria-labelledby="join-heading" className="flex flex-col gap-5">
      <div className="flex min-h-72 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-air-border bg-card p-8 shadow-lg shadow-black/20">
        <QrCodeIcon aria-hidden="true" className="size-32 text-air-foreground" />
        <h2 id="join-heading" className="text-xl font-bold">
          Scan to join
        </h2>
        <p className="text-sm text-air-muted">QR code placeholder</p>
      </div>

      <div className="rounded-2xl border border-air-border bg-card p-7 shadow-lg shadow-black/20">
        <p className="text-sm font-semibold uppercase tracking-widest text-air-muted">
          Room code
        </p>
        <p className="mt-2 text-3xl font-bold tracking-[0.2em] text-air-foreground sm:text-4xl">
          {roomCode}
        </p>
      </div>
    </aside>
  )
}
