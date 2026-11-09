import { parseGameManifest } from '@platform/sdk'
import { describe, expect, it } from 'vitest'
import manifest from '../public/manifest.json'

describe('test game manifest', () => {
  it('is valid', () => {
    expect(parseGameManifest(manifest).id).toBe('test-game')
  })
})
