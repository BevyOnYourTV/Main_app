import { describe, it, expect } from 'vitest';
import { WsException } from '@nestjs/websockets';
import { ZodWsValidationPipe } from './zod-ws-validation.pipe';
import {
  PROTOCOL_VERSION,
  createRoomEnvelopeSchema,
  joinRoomEnvelopeSchema,
  reconnectSessionEnvelopeSchema,
  sdkScreenEnvelopeSchema,
  sdkControllerEnvelopeSchema,
  parseRealtimeClientMessage,
  parseRealtimeServerMessage,
  type ServerError,
} from './realtime-protocol.schema';

describe('[B01] Versioned Real-Time Protocol Validation', () => {
  const createRoomPipe = new ZodWsValidationPipe(createRoomEnvelopeSchema);
  const joinPipe = new ZodWsValidationPipe(joinRoomEnvelopeSchema);
  const reconnectPipe = new ZodWsValidationPipe(reconnectSessionEnvelopeSchema);
  const screenPipe = new ZodWsValidationPipe(sdkScreenEnvelopeSchema);
  const controllerPipe = new ZodWsValidationPipe(sdkControllerEnvelopeSchema);

  describe('Envelope & Version Rules', () => {
    it('should reject an unsupported protocol version with PROTOCOL_ERROR', () => {
      const badVersionMessage = {
        v: PROTOCOL_VERSION + 1,
        timestamp: Date.now(),
        payload: { roomCode: 'ABCD', nickname: 'PlayerOne' },
      };

      try {
        joinPipe.transform(badVersionMessage);
        expect.fail('Should have thrown WsException');
      } catch (err) {
        expect(err).toBeInstanceOf(WsException);
        const errorData = (err as WsException).getError() as ServerError;
        expect(errorData.error.code).toBe('PROTOCOL_ERROR');
      }
    });

    it('should reject missing or invalid timestamps', () => {
      const missingTimestamp = {
        v: PROTOCOL_VERSION,
        payload: { roomCode: 'ABCD', nickname: 'PlayerOne' },
      };

      const negativeTimestamp = {
        v: PROTOCOL_VERSION,
        timestamp: -100,
        payload: { roomCode: 'ABCD', nickname: 'PlayerOne' },
      };

      expect(() => joinPipe.transform(missingTimestamp)).toThrow(WsException);
      expect(() => joinPipe.transform(negativeTimestamp)).toThrow(WsException);
    });

    it('should reject non-object root inputs', () => {
      expect(() => joinPipe.transform(null)).toThrow(WsException);
      expect(() => joinPipe.transform('invalid-string')).toThrow(WsException);
    });
  });

  describe('Session & Room Envelopes', () => {
    it('should accept a valid room:create envelope with empty payload', () => {
      const validCreate = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: {},
      };

      const result = createRoomPipe.transform(validCreate);
      expect(result.v).toBe(PROTOCOL_VERSION);
      expect(result.payload).toEqual({});
    });

    it('should accept and sanitize a valid room:join envelope', () => {
      const validMessage = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: {
          roomCode: ' abcd ',
          nickname: '  PlayerOne  ',
        },
      };

      const result = joinPipe.transform(validMessage);
      expect(result.v).toBe(PROTOCOL_VERSION);
      expect(result.payload.roomCode).toBe('ABCD');
      expect(result.payload.nickname).toBe('PlayerOne');
    });

    it('should reject invalid room:join fields (short code, non-alphanumeric, empty nickname)', () => {
      expect(() =>
        joinPipe.transform({
          v: PROTOCOL_VERSION,
          timestamp: Date.now(),
          payload: { roomCode: '12', nickname: 'PlayerOne' },
        }),
      ).toThrow(WsException);

      expect(() =>
        joinPipe.transform({
          v: PROTOCOL_VERSION,
          timestamp: Date.now(),
          payload: { roomCode: 'AB$%', nickname: 'PlayerOne' },
        }),
      ).toThrow(WsException);

      expect(() =>
        joinPipe.transform({
          v: PROTOCOL_VERSION,
          timestamp: Date.now(),
          payload: { roomCode: 'ABCD', nickname: '   ' },
        }),
      ).toThrow(WsException);
    });

    it('should validate session:reconnect token length', () => {
      const validReconnect = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: { sessionToken: 'valid-session-token-12345' },
      };

      const shortToken = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: { sessionToken: 'short' },
      };

      expect(reconnectPipe.transform(validReconnect).payload.sessionToken).toBe(
        'valid-session-token-12345',
      );
      expect(() => reconnectPipe.transform(shortToken)).toThrow(WsException);
    });
  });

  describe('SDK Encapsulated Envelopes', () => {
    it('should validate a valid SDK controller action', () => {
      const validSdkMessage = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: {
          type: 'action',
          action: {
            componentId: 'btn-jump',
            value: { kind: 'button', pressed: true },
          },
        },
      };

      const result = controllerPipe.transform(validSdkMessage);
      expect(result.payload.type).toBe('action');
    });

    it('should validate a valid SDK screen set-controller message', () => {
      const validScreenMessage = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: {
          type: 'set-controller',
          layout: {
            components: [
              { kind: 'dpad', id: 'move', label: 'Move' },
              { kind: 'button', id: 'fire', label: 'Fire' },
            ],
          },
        },
      };

      const result = screenPipe.transform(validScreenMessage);
      expect(result.payload.type).toBe('set-controller');
    });

    it('should reject an SDK layout with duplicate component IDs', () => {
      const duplicateIdsMessage = {
        v: PROTOCOL_VERSION,
        timestamp: Date.now(),
        payload: {
          type: 'set-controller',
          layout: {
            components: [
              { kind: 'button', id: 'btn-1', label: 'A' },
              { kind: 'button', id: 'btn-1', label: 'B' },
            ],
          },
        },
      };

      expect(() => screenPipe.transform(duplicateIdsMessage)).toThrow(WsException);
    });
  });

  describe('Complete Socket.IO event contract', () => {
    const envelope = (payload: unknown) => ({
      v: PROTOCOL_VERSION,
      timestamp: Date.now(),
      payload,
    });

    it('validates handshake, room lifecycle, controller input, and game messages', () => {
      expect(parseRealtimeClientMessage('session:hello', envelope({ role: 'controller' })).success).toBe(true);
      expect(parseRealtimeClientMessage('room:create', envelope({})).success).toBe(true);
      expect(parseRealtimeClientMessage('room:join', envelope({ roomCode: 'abcd', nickname: 'Guest' })).success).toBe(true);
      expect(parseRealtimeClientMessage('session:reconnect', envelope({ sessionToken: 'session-token-1234' })).success).toBe(true);
      expect(parseRealtimeClientMessage('game:input', envelope({
        type: 'action', action: { componentId: 'a', value: { kind: 'button', pressed: true } },
      })).success).toBe(true);
      expect(parseRealtimeClientMessage('game:message', envelope({ type: 'ready' })).success).toBe(true);
      expect(parseRealtimeClientMessage('ping', envelope({ id: 1 })).success).toBe(true);
    });

    it('validates lobby, player, layout, private, score, error, and pong server messages', () => {
      const player = { id: 'p1', name: 'Guest' };
      expect(parseRealtimeServerMessage('room:state', envelope({
        roomCode: 'ABCD', hostId: 'p1', players: [player], status: 'waiting',
      })).success).toBe(true);
      expect(parseRealtimeServerMessage('player:joined', envelope({ player })).success).toBe(true);
      expect(parseRealtimeServerMessage('game:layout', envelope({
        layout: { components: [{ kind: 'button', id: 'a', label: 'A' }] },
      })).success).toBe(true);
      expect(parseRealtimeServerMessage('game:private', envelope({ data: { cards: ['c1'] } })).success).toBe(true);
      expect(parseRealtimeServerMessage('game:score', envelope({ playerId: 'p1', points: 5 })).success).toBe(true);
      expect(parseRealtimeServerMessage('error', envelope({ code: 'ROOM_FULL', message: 'Room is full' })).success).toBe(true);
      expect(parseRealtimeServerMessage('pong', envelope({ id: 1, serverTimestamp: Date.now() })).success).toBe(true);
    });

    it('rejects invalid event payloads and unsupported protocol versions', () => {
      expect(parseRealtimeClientMessage('session:hello', envelope({ role: 'admin' })).success).toBe(false);
      expect(parseRealtimeClientMessage('room:join', envelope({ roomCode: '!', nickname: '' })).success).toBe(false);
      expect(parseRealtimeClientMessage('game:input', envelope({ type: 'unknown' })).success).toBe(false);
      expect(parseRealtimeClientMessage('ping', { ...envelope({ id: 1 }), v: 1 }).success).toBe(false);
    });
  });
});
