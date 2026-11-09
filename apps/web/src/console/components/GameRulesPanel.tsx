type GameRulesPanelProps = {
  gameName: string
}

export function GameRulesPanel({ gameName }: GameRulesPanelProps) {
  return (
    <aside
      aria-labelledby="game-rules-heading"
      className="flex min-h-0 items-center justify-center rounded-3xl border border-air-border bg-card p-12 text-center shadow-xl shadow-black/20"
    >
      <div className="flex max-w-xl flex-col gap-5">
        <p className="text-lg font-semibold uppercase tracking-widest text-air-muted">
          {gameName}
        </p>
        <h2 id="game-rules-heading" className="text-4xl font-bold">
          Game rules
        </h2>
        <p className="text-xl text-air-copy">
          Placeholder rules for {gameName}.
        </p>
      </div>
    </aside>
  )
}
