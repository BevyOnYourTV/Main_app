import { createScreenSdk, createWindowTransport } from '@platform/sdk'
import { runGame } from './runGame'

const status = document.getElementById('status')

if (!status) {
  throw new Error('Game status element was not found')
}

const sdk = createScreenSdk(
  createWindowTransport({
    host: window,
    target: window.parent,
    targetOrigin: '*',
  }),
)

runGame(sdk, (text) => {
  status.textContent = text
})
