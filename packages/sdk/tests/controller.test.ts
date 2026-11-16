import { describe, expect, it, vi } from 'vitest'
import {
  createControllerSdk,
  createMemoryTransportPair,
  type ControllerLayout,
} from '../src'

const layout: ControllerLayout = {
  components: [{ kind: 'button', id: 'fire', label: 'Fire' }],
}
const press = { kind: 'button', pressed: true } as const

function setup() {
  const [phoneSide, platformSide] = createMemoryTransportPair()
  const onProtocolError = vi.fn()
  const sent = vi.fn()
  platformSide.onMessage(sent)
  const sdk = createControllerSdk(phoneSide, { onProtocolError })
  return { onProtocolError, platformSide, sdk, sent }
}

describe('createControllerSdk', () => {
  it('stores and announces the layout it receives', () => {
    const { platformSide, sdk } = setup()
    const onLayout = vi.fn()
    sdk.onLayout(onLayout)

    platformSide.send({ type: 'layout', layout })

    expect(sdk.getLayout()).toEqual(layout)
    expect(onLayout).toHaveBeenCalledWith(layout)
  })

  it('sends an action that matches the layout', () => {
    const { platformSide, sdk, sent } = setup()
    platformSide.send({ type: 'layout', layout })

    expect(sdk.sendAction('fire', press)).toEqual({ ok: true })
    expect(sent).toHaveBeenCalledWith({
      type: 'action',
      action: { componentId: 'fire', value: press },
    })
  })

  it('does not send an action before any layout arrives', () => {
    const { sdk, sent } = setup()

    expect(sdk.sendAction('fire', press)).toEqual({
      ok: false,
      reason: 'no-layout',
    })
    expect(sent).not.toHaveBeenCalled()
  })

  it('delivers private messages', () => {
    const { platformSide, sdk } = setup()
    const onPrivate = vi.fn()
    sdk.onPrivateMessage(onPrivate)

    platformSide.send({ type: 'private', data: 'secret' })

    expect(onPrivate).toHaveBeenCalledWith('secret')
  })

  it('reports malformed messages', () => {
    const { onProtocolError, platformSide } = setup()

    platformSide.send({ type: 'layout', layout: { components: [] } })

    expect(onProtocolError).toHaveBeenCalledOnce()
  })
})
