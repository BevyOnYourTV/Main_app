export const WINNING_SCORE = 10

export type TallyState = {
  scores: Readonly<Record<string, number>>
  winnerId: string | null
}

export const initialTallyState: TallyState = { scores: {}, winnerId: null }

/** Counts one press. Nothing changes once a player has won. */
export function applyPress(state: TallyState, playerId: string): TallyState {
  if (state.winnerId) {
    return state
  }
  const score = (state.scores[playerId] ?? 0) + 1
  return {
    scores: { ...state.scores, [playerId]: score },
    winnerId: score >= WINNING_SCORE ? playerId : null,
  }
}
