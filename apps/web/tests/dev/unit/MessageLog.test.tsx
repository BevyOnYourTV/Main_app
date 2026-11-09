import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MessageLog } from '../../../src/dev/components/MessageLog'

describe('MessageLog', () => {
  it('shows direction, player and rejection reason', () => {
    const markup = renderToStaticMarkup(
      <MessageLog
        entries={[
          {
            at: 1,
            direction: 'from-controller',
            message: { componentId: 'fire' },
            playerId: 'player-1',
            rejection: 'no-layout',
          },
        ]}
      />,
    )

    expect(markup).toContain('from-controller')
    expect(markup).toContain('player-1')
    expect(markup).toContain('rejected: no-layout')
  })

  it('shows the newest entries first and limits how many', () => {
    const entries = Array.from({ length: 60 }, (_, index) => ({
      at: index,
      direction: 'to-screen' as const,
      message: { index },
    }))

    const markup = renderToStaticMarkup(<MessageLog entries={entries} />)

    expect(markup.match(/<li>/g)).toHaveLength(50)
    const newest = markup.indexOf('index&quot;:59')
    expect(newest).toBeGreaterThan(-1)
    expect(newest).toBeLessThan(markup.indexOf('index&quot;:58'))
  })
})
