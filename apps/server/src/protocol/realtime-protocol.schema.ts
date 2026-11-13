import { z } from 'zod';
import {
  controllerLayoutSchema,
  controllerOutboundSchema,
  playerSchema,
  screenOutboundSchema,
} from '@platform/sdk';

export const PROTOCOL_VERSION = 0.1;
const MAX_PLAYERS_PER_ROOM = 8;
const idSchema = z.string().min(1).max(64);
const roomCodeSchema = z
  .string()
  .trim()
  .min(4)
  .max(6)
  .regex(/^[a-zA-Z0-9]+$/, 'Room code must be alphanumeric')
  .transform((value) => value.toUpperCase());
const playerListSchema = z.array(playerSchema).max(MAX_PLAYERS_PER_ROOM);

/** All Socket.IO event payloads are versioned and timestamped uniformly. */
export function createEnvelopeSchema<T extends z.ZodTypeAny>(payloadSchema: T) {
  return z.object({
    v: z.literal(PROTOCOL_VERSION),
    timestamp: z.number().int().positive(),
    payload: payloadSchema,
  });
}

// Client -> server. Socket.IO event names are the keys in these schema maps.
export const realtimeClientPayloadSchemas = {
  'session:hello': z.object({ role: z.enum(['console', 'controller', 'game']) }),
  'room:create': z.object({}),
  'room:join': z.object({
    roomCode: roomCodeSchema,
    nickname: z.string().trim().min(1).max(32),
    avatar: z.string().trim().max(64).optional(),
  }),
  'session:reconnect': z.object({ sessionToken: z.string().min(10).max(256) }),
  'room:leave': z.object({}),
  'room:kick': z.object({ playerId: idSchema }),
  'game:start': z.object({ gameId: idSchema }),
  'game:input': controllerOutboundSchema,
  'game:message': screenOutboundSchema,
  ping: z.object({ id: z.number().int().nonnegative() }),
} as const;

// Server -> client. Route game:private only to the addressed player's socket.
export const realtimeServerPayloadSchemas = {
  'session:ready': z.object({
    role: z.enum(['console', 'controller', 'game']),
    sessionToken: z.string().min(10).max(256),
    playerId: idSchema.optional(),
  }),
  'room:created': z.object({ roomCode: roomCodeSchema, hostId: idSchema }),
  'room:joined': z.object({
    roomCode: roomCodeSchema,
    playerId: idSchema,
    hostId: idSchema,
    players: playerListSchema,
  }),
  'room:state': z.object({
    roomCode: roomCodeSchema,
    hostId: idSchema,
    players: playerListSchema,
    gameId: idSchema.optional(),
    status: z.enum(['waiting', 'playing', 'finished']),
  }),
  'player:joined': z.object({ player: playerSchema }),
  'player:left': z.object({ playerId: idSchema }),
  'host:changed': z.object({ hostId: idSchema }),
  'game:started': z.object({ gameId: idSchema }),
  'game:ended': z.object({ gameId: idSchema.optional() }),
  'game:layout': z.object({
    layout: controllerLayoutSchema,
    playerId: idSchema.optional(),
  }),
  'game:private': z.object({ data: z.json() }),
  'game:score': z.object({ playerId: idSchema, points: z.number().int() }),
  pong: z.object({ id: z.number().int().nonnegative(), serverTimestamp: z.number().int().positive() }),
  error: z.object({
    code: z.enum([
      'PROTOCOL_ERROR',
      'INVALID_PAYLOAD',
      'ROOM_NOT_FOUND',
      'ROOM_FULL',
      'UNAUTHORIZED',
      'RATE_LIMITED',
      'CONFLICT',
    ]),
    message: z.string().min(1).max(256),
    details: z.array(z.string().max(256)).max(16).optional(),
  }),
} as const;

export const realtimeClientSchemas = {
  'session:hello': createEnvelopeSchema(realtimeClientPayloadSchemas['session:hello']),
  'room:create': createEnvelopeSchema(realtimeClientPayloadSchemas['room:create']),
  'room:join': createEnvelopeSchema(realtimeClientPayloadSchemas['room:join']),
  'session:reconnect': createEnvelopeSchema(realtimeClientPayloadSchemas['session:reconnect']),
  'room:leave': createEnvelopeSchema(realtimeClientPayloadSchemas['room:leave']),
  'room:kick': createEnvelopeSchema(realtimeClientPayloadSchemas['room:kick']),
  'game:start': createEnvelopeSchema(realtimeClientPayloadSchemas['game:start']),
  'game:input': createEnvelopeSchema(realtimeClientPayloadSchemas['game:input']),
  'game:message': createEnvelopeSchema(realtimeClientPayloadSchemas['game:message']),
  ping: createEnvelopeSchema(realtimeClientPayloadSchemas.ping),
} as const;

export const realtimeServerSchemas = {
  'session:ready': createEnvelopeSchema(realtimeServerPayloadSchemas['session:ready']),
  'room:created': createEnvelopeSchema(realtimeServerPayloadSchemas['room:created']),
  'room:joined': createEnvelopeSchema(realtimeServerPayloadSchemas['room:joined']),
  'room:state': createEnvelopeSchema(realtimeServerPayloadSchemas['room:state']),
  'player:joined': createEnvelopeSchema(realtimeServerPayloadSchemas['player:joined']),
  'player:left': createEnvelopeSchema(realtimeServerPayloadSchemas['player:left']),
  'host:changed': createEnvelopeSchema(realtimeServerPayloadSchemas['host:changed']),
  'game:started': createEnvelopeSchema(realtimeServerPayloadSchemas['game:started']),
  'game:ended': createEnvelopeSchema(realtimeServerPayloadSchemas['game:ended']),
  'game:layout': createEnvelopeSchema(realtimeServerPayloadSchemas['game:layout']),
  'game:private': createEnvelopeSchema(realtimeServerPayloadSchemas['game:private']),
  'game:score': createEnvelopeSchema(realtimeServerPayloadSchemas['game:score']),
  pong: createEnvelopeSchema(realtimeServerPayloadSchemas.pong),
  error: createEnvelopeSchema(realtimeServerPayloadSchemas.error),
} as const;

export type RealtimeClientEvent = keyof typeof realtimeClientSchemas;
export type RealtimeServerEvent = keyof typeof realtimeServerSchemas;
export type RealtimeClientMessage<K extends RealtimeClientEvent = RealtimeClientEvent> = z.infer<(typeof realtimeClientSchemas)[K]>;
export type RealtimeServerMessage<K extends RealtimeServerEvent = RealtimeServerEvent> = z.infer<(typeof realtimeServerSchemas)[K]>;

export function parseRealtimeClientMessage<K extends RealtimeClientEvent>(event: K, input: unknown) {
  return realtimeClientSchemas[event].safeParse(input);
}

export function parseRealtimeServerMessage<K extends RealtimeServerEvent>(event: K, input: unknown) {
  return realtimeServerSchemas[event].safeParse(input);
}

// Existing aliases keep the current tests and early gateway code compatible.
export const createRoomPayloadSchema = realtimeClientPayloadSchemas['room:create'];
export const createRoomEnvelopeSchema = realtimeClientSchemas['room:create'];
export const joinRoomPayloadSchema = realtimeClientPayloadSchemas['room:join'];
export const joinRoomEnvelopeSchema = realtimeClientSchemas['room:join'];
export const reconnectSessionPayloadSchema = realtimeClientPayloadSchemas['session:reconnect'];
export const reconnectSessionEnvelopeSchema = realtimeClientSchemas['session:reconnect'];
export const sdkScreenEnvelopeSchema = realtimeClientSchemas['game:message'];
export const sdkControllerEnvelopeSchema = realtimeClientSchemas['game:input'];

export const serverErrorSchema = z.object({
  v: z.literal(PROTOCOL_VERSION),
  timestamp: z.number().int().positive(),
  error: realtimeServerPayloadSchemas.error,
});

export type CreateRoomEnvelope = z.infer<typeof createRoomEnvelopeSchema>;
export type JoinRoomEnvelope = z.infer<typeof joinRoomEnvelopeSchema>;
export type ReconnectSessionEnvelope = z.infer<typeof reconnectSessionEnvelopeSchema>;
export type SdkScreenEnvelope = z.infer<typeof sdkScreenEnvelopeSchema>;
export type SdkControllerEnvelope = z.infer<typeof sdkControllerEnvelopeSchema>;
export type ServerError = z.infer<typeof serverErrorSchema>;
