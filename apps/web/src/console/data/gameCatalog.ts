export type GameSummary = {
  id: string
  name: string
}

export type GameCategory = {
  games: GameSummary[]
  id: string
  name: string
}

export const mockGameCategories: GameCategory[] = [
  {
    id: 'arcade',
    name: 'Arcade',
    games: [
      { id: 'sky-sprint', name: 'Sky Sprint' },
      { id: 'neon-drift', name: 'Neon Drift' },
      { id: 'pixel-panic', name: 'Pixel Panic' },
    ],
  },
  {
    id: 'party',
    name: 'Party',
    games: [
      { id: 'quick-draw', name: 'Quick Draw' },
      { id: 'crowd-control', name: 'Crowd Control' },
      { id: 'last-one-standing', name: 'Last One Standing' },
    ],
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    games: [
      { id: 'color-grid', name: 'Color Grid' },
      { id: 'signal-match', name: 'Signal Match' },
    ],
  },
  {
    id: 'strategy',
    name: 'Strategy',
    games: [
      { id: 'tiny-tactics', name: 'Tiny Tactics' },
      { id: 'tower-command', name: 'Tower Command' },
    ],
  },
]

export const initialGame = mockGameCategories[0].games[0]

export function findGameById(gameId: string | undefined) {
  return mockGameCategories
    .flatMap((category) => category.games)
    .find((game) => game.id === gameId)
}
