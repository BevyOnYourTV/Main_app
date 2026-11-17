import { describe, expect, it } from 'vitest'
import { applyPress, initialTallyState, WINNING_SCORE } from '../src/game'

describe('applyPress', () => {
  it('counts presses per player', () => {
    const state = applyPress(applyPress(initialTallyState, 'a'), 'b')

    expect(state.scores).toEqual({ a: 1, b: 1 })
    expect(state.winnerId).toBeNull()
  })

  it('declares the first player to reach the winning score', () => {
    const scored = { scores: { a: WINNING_SCORE - 1 }, winnerId: null }

    expect(applyPress(scored, 'a').winnerId).toBe('a')
  })

  it('ignores presses once the game is won', () => {
    const won = { scores: { a: WINNING_SCORE }, winnerId: 'a' }

    expect(applyPress(won, 'b')).toBe(won)
  })
})
