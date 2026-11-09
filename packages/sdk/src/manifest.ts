import { z } from 'zod'

export const MAX_PLAYERS_PER_ROOM = 8

export const gameManifestSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(60),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    entry: z.string().min(1),
    minPlayers: z.number().int().min(1).max(MAX_PLAYERS_PER_ROOM),
    maxPlayers: z.number().int().min(1).max(MAX_PLAYERS_PER_ROOM),
    controllerComponents: z.array(z.enum(['button', 'dpad', 'choice'])).min(1),
    accessibility: z.array(z.string().min(1)),
  })
  .refine(({ minPlayers, maxPlayers }) => minPlayers <= maxPlayers, {
    message: 'minPlayers must not exceed maxPlayers',
    path: ['minPlayers'],
  })

export type GameManifest = z.infer<typeof gameManifestSchema>

export function parseGameManifest(input: unknown): GameManifest {
  return gameManifestSchema.parse(input)
}
