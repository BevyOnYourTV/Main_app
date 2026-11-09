import { describe, expect, it } from 'vitest'
import { parseGameManifest } from '../src'

const validManifest = {
  id: 'test-game',
  name: 'Test Game',
  version: '1.0.0',
  entry: 'index.html',
  minPlayers: 1,
  maxPlayers: 8,
  controllerComponents: ['button'],
  accessibility: ['screen-reader'],
}

describe('parseGameManifest', () => {
  it('accepts a valid manifest', () => {
    expect(parseGameManifest(validManifest)).toEqual(validManifest)
  })

  it('rejects more players than a room can hold', () => {
    expect(() =>
      parseGameManifest({ ...validManifest, maxPlayers: 9 }),
    ).toThrow()
  })

  it('rejects a minimum above the maximum', () => {
    expect(() =>
      parseGameManifest({ ...validManifest, minPlayers: 4, maxPlayers: 2 }),
    ).toThrow('minPlayers must not exceed maxPlayers')
  })

  it('rejects a non-semantic version', () => {
    expect(() =>
      parseGameManifest({ ...validManifest, version: 'latest' }),
    ).toThrow()
  })

  it('rejects an unknown controller component', () => {
    expect(() =>
      parseGameManifest({
        ...validManifest,
        controllerComponents: ['steering-wheel'],
      }),
    ).toThrow()
  })
})
