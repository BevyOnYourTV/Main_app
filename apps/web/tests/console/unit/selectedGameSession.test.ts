import { beforeEach, describe, expect, it } from 'vitest'
import { findGameById } from '../../../src/console/data/gameCatalog'
import {
  getSessionSelectedGame,
  setSessionSelectedGame,
} from '../../../src/console/data/selectedGameSession'

describe('selectedGameSession', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('stores and restores a valid selected game', () => {
    const game = findGameById('color-grid')

    if (!game) {
      throw new Error('Color Grid mock game is missing')
    }

    setSessionSelectedGame(game)

    expect(getSessionSelectedGame()).toEqual(game)
  })

  it('ignores a stored game that is no longer in the catalogue', () => {
    window.sessionStorage.setItem(
      'airconsole:selected-game-id',
      'removed-game',
    )

    expect(getSessionSelectedGame()).toBeUndefined()
    expect(window.sessionStorage.length).toBe(0)
  })
})
