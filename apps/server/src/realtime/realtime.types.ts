import type { ControllerLayout, Player } from '../protocol/realtime-protocol.schema.js';

export type Role = 'console' | 'controller';
export type RoomStatus = 'waiting' | 'playing' | 'paused' | 'finished';

export type SessionData = {
  role?: Role;
  sessionToken?: string;
  roomCode?: string;
  playerId?: string;
  authTimer?: ReturnType<typeof setTimeout>;
};

export type ClientSocket = import('socket.io').Socket & { data: SessionData };
export type RoomPlayer = Player & { socketId: string };

export type Room = {
  code: string;
  hostId: string;
  hostSocketId: string;
  players: Map<string, RoomPlayer>;
  status: RoomStatus;
  gameId?: string;
  layout?: ControllerLayout;
  playerLayouts: Map<string, ControllerLayout>;
};

export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const MAX_PLAYERS = 8;
export const DISCONNECT_GRACE_MS = 30_000;
export const CLIENT_EVENTS = new Set<string>([
  'session:hello', 'session:reconnect', 'room:create', 'room:join', 'room:leave',
  'room:kick', 'game:start', 'game:input', 'game:message', 'ping',
]);
