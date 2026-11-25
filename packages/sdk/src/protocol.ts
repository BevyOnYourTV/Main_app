import { z } from 'zod'

const idSchema = z.string().min(1).max(64)
const labelSchema = z.string().min(1).max(80)

export const playerSchema = z.object({
  id: idSchema,
  name: z.string().min(1).max(32),
  avatar: z.string().max(64).optional(),
})

/** Version of the controller layout format; a layout without `version` is version 1. */
export const CONTROLLER_LAYOUT_VERSION = 1

/** Longest text a player can send, whatever a component allows. */
export const MAX_TEXT_LENGTH = 280

/** Most points in one drawing stroke. */
export const MAX_STROKE_POINTS = 256

/** Fields shared by every component: `label` is its accessible name, `description` an optional hint. */
const componentBase = {
  id: idSchema,
  label: labelSchema,
  description: z.string().min(1).max(200).optional(),
}

/** Every component kind, for lists such as a game manifest's `controllerComponents`. */
export const CONTROLLER_COMPONENT_KINDS = [
  'button',
  'dpad',
  'joystick',
  'touchpad',
  'text',
  'choice',
  'drawing',
] as const

const unitSchema = z.number().min(0).max(1)
const axisSchema = z.number().min(-1).max(1)

export const controllerComponentSchema = z.discriminatedUnion('kind', [
  z.object({ ...componentBase, kind: z.literal('button') }),
  z.object({ ...componentBase, kind: z.literal('dpad') }),
  z.object({ ...componentBase, kind: z.literal('joystick') }),
  z.object({ ...componentBase, kind: z.literal('touchpad') }),
  z.object({
    ...componentBase,
    kind: z.literal('text'),
    maxLength: z.number().int().min(1).max(MAX_TEXT_LENGTH).optional(),
    placeholder: z.string().max(80).optional(),
  }),
  z.object({
    ...componentBase,
    kind: z.literal('choice'),
    options: z
      .array(z.object({ id: idSchema, label: labelSchema }))
      .min(2)
      .max(8),
  }),
  z.object({ ...componentBase, kind: z.literal('drawing') }),
])

export const controllerLayoutSchema = z.object({
  version: z.literal(CONTROLLER_LAYOUT_VERSION).optional(),
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
  /** Stick position; (0, 0) is the centre, sent again when released. */
  z.object({ kind: z.literal('joystick'), x: axisSchema, y: axisSchema }),
  /** Touch on the free area, in fractions of its width and height. */
  z.object({
    kind: z.literal('touchpad'),
    phase: z.enum(['start', 'move', 'end']),
    x: unitSchema,
    y: unitSchema,
  }),
  z.object({
    kind: z.literal('text'),
    text: z.string().max(MAX_TEXT_LENGTH),
  }),
  z.object({ kind: z.literal('choice'), optionId: idSchema }),
  /** One finished stroke, in fractions of the canvas width and height. */
  z.object({
    kind: z.literal('drawing'),
    points: z
      .array(z.tuple([unitSchema, unitSchema]))
      .min(1)
      .max(MAX_STROKE_POINTS),
  }),
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
  /** Whose turn it is; `null` when it is nobody's turn. */
  z.object({ type: z.literal('turn'), playerId: idSchema.nullable() }),
  z.object({
    type: z.literal('achievement'),
    playerId: idSchema,
    achievementId: idSchema,
  }),
])

/** Messages the platform sends to a phone. A phone only learns about its own turn and achievements. */
export const controllerInboundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('layout'), layout: controllerLayoutSchema }),
  z.object({ type: z.literal('private'), data: privateDataSchema }),
  z.object({ type: z.literal('turn'), isYourTurn: z.boolean() }),
  z.object({ type: z.literal('achievement'), achievementId: idSchema }),
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
