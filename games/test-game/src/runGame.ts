import type { ControllerLayout, ScreenSdk, Unsubscribe } from '@platform/sdk'
import { applyPress, initialTallyState, WINNING_SCORE } from './game'

const layout: ControllerLayout = {
  components: [{ kind: 'button', id: 'tap', label: 'Tap' }],
}

/** Plays the game through the SDK only. `show` displays a status text. */
export function runGame(
  sdk: ScreenSdk,
  show: (text: string) => void,
): Unsubscribe {
  let state = initialTallyState

  const nameOf = (playerId: string) =>
    sdk.getPlayers().find(({ id }) => id === playerId)?.name ?? playerId

  const stop = sdk.onAction(({ action, playerId }) => {
    if (action.value.kind !== 'button' || !action.value.pressed) {
      return
    }
    const next = applyPress(state, playerId)
    if (next === state) {
      return
    }
    state = next
    sdk.recordScore(playerId, next.scores[playerId] ?? 0)
    if (next.winnerId) {
      show(`${nameOf(next.winnerId)} wins!`)
      sdk.end()
    } else {
      show(`${nameOf(playerId)}: ${next.scores[playerId]} of ${WINNING_SCORE}`)
    }
  })

  sdk.setController(layout)
  sdk.start()
  show(`Tap as fast as you can. First to ${WINNING_SCORE} wins.`)

  return stop
}
