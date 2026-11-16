import type { LogEntry } from '@platform/simulator'

type MessageLogProps = {
  entries: readonly LogEntry[]
}

const VISIBLE_ENTRIES = 50

export function MessageLog({ entries }: MessageLogProps) {
  const visible = entries.slice(-VISIBLE_ENTRIES).reverse()

  return (
    <section aria-labelledby="message-log-heading">
      <h2 className="mb-2 text-lg font-bold" id="message-log-heading">
        Messages
      </h2>
      <ol className="grid max-h-96 gap-1 overflow-y-auto font-mono text-xs">
        {visible.map((entry) => (
          <li key={`${entry.at}-${entries.indexOf(entry)}`}>
            <span>{entry.direction}</span>
            {entry.playerId && <span> [{entry.playerId}]</span>}
            {entry.rejection && <strong> rejected: {entry.rejection}</strong>}
            <span> {JSON.stringify(entry.message)}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
