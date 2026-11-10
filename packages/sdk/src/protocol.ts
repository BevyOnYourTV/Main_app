import { z } from 'zod'

const idSchema = z.string().min(1).max(64)
const labelSchema = z.string().min(1).max(80)

export const playerSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(32),
  avatar: z.string().max(64).optional(),
})

const buttonSchema = z.object({
  kind: z.literal('button'),
  id: idSchema,
  label: labelSchema,
})

const dpadSchema = z.object({
  kind: z.literal('dpad'),
  id: idSchema,
  label: labelSchema,
})

const choiceSchema = z.object({
  kind: z.literal('choice'),
  id: idSchema,
  label: labelSchema,
  options: z
    .array(z.object({ id: idSchema, label: labelSchema }))
    .min(2)
    .max(8),
})

export const controllerComponentSchema = z.discriminatedUnion('kind', [
  buttonSchema,
  dpadSchema,
  choiceSchema,
])

export const controllerLayoutSchema = z.object({
  components: z
    .array(controllerComponentSchema)
    .min(1)
    .max(16)
    .refine(
      (components) =>
        new Set(components.map(({ id }) => id)).size === components.length,
      { message: 'Component ids must be unique' },
    ),
})

export const actionValueSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('button'), pressed: z.boolean() }),
  z.object({
    kind: z.literal('dpad'),
    direction: z.enum(['up', 'down', 'left', 'right', 'none']),
  }),
  z.object({ kind: z.literal('choice'), optionId: idSchema }),
])

export const controllerActionSchema = z.object({
  componentId: idSchema,
  value: actionValueSchema,
})

const privateDataSchema = z.json()

/** Messages the platform sends to the game running on the screen. */
export const screenInboundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('players'), players: z.array(playerSchema) }),
  z.object({ type: z.literal('player-joined'), player: playerSchema }),
  z.object({ type: z.literal('player-left'), playerId: idSchema }),
  z.object({
    type: z.literal('action'),
    playerId: idSchema,
    action: controllerActionSchema,
  }),
  z.object({ type: z.literal('ping'), id: z.number().int() }),
])

/** Messages the game running on the screen sends to the platform. */
export const screenOutboundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('pong'), id: z.number().int() }),
  z.object({
    type: z.literal('set-controller'),
    layout: controllerLayoutSchema,
    playerId: idSchema.optional(),
  }),
  z.object({
    type: z.literal('private'),
    playerId: idSchema,
    data: privateDataSchema,
  }),
  z.object({
    type: z.literal('lifecycle'),
    phase: z.enum(['start', 'pause', 'resume', 'end']),
  }),
  z.object({
    type: z.literal('score'),
    playerId: idSchema,
    points: z.number().int(),
  }),
])

/** Messages the platform sends to a phone. */
export const controllerInboundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('layout'), layout: controllerLayoutSchema }),
  z.object({ type: z.literal('private'), data: privateDataSchema }),
])

/** Messages a phone sends to the platform. */
export const controllerOutboundSchema = z.object({
  type: z.literal('action'),
  action: controllerActionSchema,
})

export type Player = z.infer<typeof playerSchema>
export type ControllerComponent = z.infer<typeof controllerComponentSchema>
export type ControllerLayout = z.infer<typeof controllerLayoutSchema>
export type ActionValue = z.infer<typeof actionValueSchema>
export type ControllerAction = z.infer<typeof controllerActionSchema>
export type PrivateData = z.infer<typeof privateDataSchema>
export type ScreenInbound = z.infer<typeof screenInboundSchema>
export type ScreenOutbound = z.infer<typeof screenOutboundSchema>
export type ControllerInbound = z.infer<typeof controllerInboundSchema>
export type ControllerOutbound = z.infer<typeof controllerOutboundSchema>
