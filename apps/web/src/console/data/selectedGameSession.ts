import { findGameById, type GameSummary } from './gameCatalog'

const selectedGameStorageKey = 'airconsole:selected-game-id'

export function getSessionSelectedGame() {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const gameId = window.sessionStorage.getItem(selectedGameStorageKey)
    const game = findGameById(gameId ?? undefined)

    if (!game && gameId) {
      window.sessionStorage.removeItem(selectedGameStorageKey)
    }

    return game
  } catch {
    return undefined
  }
}

export function setSessionSelectedGame(game: GameSummary) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(selectedGameStorageKey, game.id)
  } catch {
    // The UI remains usable when storage is unavailable.
  }
}
