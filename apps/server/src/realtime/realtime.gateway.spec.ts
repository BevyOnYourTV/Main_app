import { describe, expect, it, vi } from 'vitest';
import { RealtimeGateway } from './realtime.gateway.js';
import { PROTOCOL_VERSION } from '../protocol/realtime-protocol.schema.js';

function createSocket(id: string) {
  const emitted: Array<{ event: string; data: unknown }> = [];
  const socket = {
    id,
    data: {} as Record<string, unknown>,
    emit: vi.fn((event: string, data: unknown) => {
      emitted.push({ event, data });
      return true;
    }),
    join: vi.fn(async () => undefined),
    leave: vi.fn(async () => undefined),
    disconnect: vi.fn(),
    onAny: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
  };
  return { socket, emitted };
}

const envelope = (payload: unknown) => ({
  v: PROTOCOL_VERSION,
  timestamp: Date.now(),
  payload,
});

function eventData<T>(events: Array<{ event: string; data: unknown }>, event: string): T {
  const item = events.find((candidate) => candidate.event === event);
  if (!item) throw new Error(`Expected ${event} event`);
  return item.data as T;
}

describe('RealtimeGateway', () => {
  it('authenticates console and controller, creates a room, and routes validated input', () => {
    const gateway = new RealtimeGateway();
    const { socket: consoleSocket, emitted: consoleEvents } = createSocket('console-1');
    const { socket: controllerSocket, emitted: controllerEvents } = createSocket('controller-1');
    const socketMap = new Map([
      [consoleSocket.id, consoleSocket],
      [controllerSocket.id, controllerSocket],
    ]);
    const broadcast = vi.fn();
    Object.assign(gateway, {
      server: {
        sockets: socketMap,
        to: vi.fn(() => ({ emit: (event: string, data: unknown) => broadcast(event, data) })),
      },
    });

    gateway.handleConnection(consoleSocket as never);
    gateway.handleHello(consoleSocket as never, envelope({ role: 'console' }));
    gateway.handleCreateRoom(consoleSocket as never, envelope({}));
    const created = consoleEvents.find(({ event }) => event === 'room:created')?.data as {
      payload: { roomCode: string };
    };
    const roomCode = created.payload.roomCode;
    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

    gateway.handleConnection(controllerSocket as never);
    gateway.handleHello(controllerSocket as never, envelope({ role: 'controller' }));
    gateway.handleJoinRoom(controllerSocket as never, envelope({ roomCode, nickname: '  Alex  ' }));
    const joined = controllerEvents.find(({ event }) => event === 'room:joined')?.data as {
      payload: { playerId: string };
    };
    expect(joined.payload.playerId).toBeTruthy();
    expect(broadcast).toHaveBeenCalledWith('room:state', expect.objectContaining({ payload: expect.objectContaining({ roomCode }) }));

    gateway.handleStartGame(consoleSocket as never, envelope({ gameId: 'test-game' }));
    gateway.handleGameMessage(consoleSocket as never, envelope({
      type: 'set-controller',
      layout: { components: [{ kind: 'button', id: 'jump', label: 'Jump' }] },
    }));
    expect(controllerEvents.some(({ event }) => event === 'game:layout')).toBe(true);
    gateway.handleControllerInput(controllerSocket as never, envelope({
      type: 'action',
      action: { componentId: 'jump', value: { kind: 'button', pressed: true } },
    }));

    expect(consoleEvents.some(({ event, data }) => event === 'player:action' && Boolean(data))).toBe(true);
  });

  it('rejects unauthenticated and malformed messages with a versioned error', () => {
    const gateway = new RealtimeGateway();
    const { socket, emitted } = createSocket('untrusted');
    Object.assign(gateway, {
      server: { sockets: new Map([[socket.id, socket]]), to: vi.fn(() => ({ emit: vi.fn() })) },
    });
    gateway.handleConnection(socket as never);
    gateway.handleCreateRoom(socket as never, envelope({}));
    const error = emitted.find(({ event }) => event === 'error')?.data as {
      v: number;
      payload: { code: string };
    };
    expect(error.v).toBe(PROTOCOL_VERSION);
    expect(error.payload.code).toBe('UNAUTHORIZED');
  });

  it('resumes the authenticated session and restores its room after a transport drop', () => {
    const gateway = new RealtimeGateway();
    const { socket: host, emitted: hostEvents } = createSocket('host');
    const { socket: firstConnection, emitted: firstEvents } = createSocket('player-old');
    const socketMap = new Map<string, ReturnType<typeof createSocket>['socket']>([
      [host.id, host],
      [firstConnection.id, firstConnection],
    ]);
    Object.assign(gateway, {
      server: { sockets: socketMap, to: vi.fn(() => ({ emit: vi.fn() })) },
    });

    gateway.handleConnection(host as never);
    gateway.handleHello(host as never, envelope({ role: 'console' }));
    gateway.handleCreateRoom(host as never, envelope({}));
    const roomCode = eventData<{ payload: { roomCode: string } }>(hostEvents, 'room:created').payload.roomCode;

    gateway.handleConnection(firstConnection as never);
    gateway.handleHello(firstConnection as never, envelope({ role: 'controller' }));
    gateway.handleJoinRoom(firstConnection as never, envelope({ roomCode, nickname: 'Alex' }));
    const playerId = eventData<{ payload: { playerId: string } }>(firstEvents, 'room:joined').payload.playerId;
    const token = eventData<{ payload: { sessionToken: string } }>(firstEvents, 'session:ready').payload.sessionToken;
    gateway.handleGameMessage(host as never, envelope({
      type: 'set-controller',
      layout: { components: [{ kind: 'button', id: 'jump', label: 'Jump' }] },
    }));

    gateway.handleDisconnect(firstConnection as never);
    socketMap.delete(firstConnection.id);
    const { socket: resumed, emitted: resumedEvents } = createSocket('player-new');
    socketMap.set(resumed.id, resumed);
    gateway.handleConnection(resumed as never);
    gateway.handleReconnect(resumed as never, envelope({ sessionToken: token }));

    const resumedSession = resumedEvents.find(({ event }) => event === 'session:ready')?.data as {
      payload: { sessionToken: string; playerId?: string };
    };
    expect(resumedSession.payload.sessionToken).toBe(token);
    expect(resumedSession.payload.playerId).toBe(playerId);
    expect(resumed.join).toHaveBeenCalledWith(roomCode);
    expect(resumedEvents.some(({ event }) => event === 'game:layout')).toBe(true);
  });
});
