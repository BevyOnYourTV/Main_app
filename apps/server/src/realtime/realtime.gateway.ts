import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import type { ControllerLayout, Player, ScreenOutbound } from '../protocol/realtime-protocol.schema.js';
import { validateAction } from '../protocol/action-validation.js';
import {
  PROTOCOL_VERSION,
  realtimeClientSchemas,
  realtimeServerSchemas,
  type RealtimeClientEvent,
  type RealtimeServerEvent,
} from '../protocol/realtime-protocol.schema.js';

type Role = 'console' | 'controller';
type RoomStatus = 'waiting' | 'playing' | 'paused' | 'finished';
type SessionData = {
  role?: Role;
  sessionToken?: string;
  roomCode?: string;
  playerId?: string;
  authTimer?: ReturnType<typeof setTimeout>;
};
type ClientSocket = Socket & { data: SessionData };
type RoomPlayer = Player & { socketId: string };
type Room = {
  code: string;
  hostId: string;
  hostSocketId: string;
  players: Map<string, RoomPlayer>;
  status: RoomStatus;
  gameId?: string;
  layout?: ControllerLayout;
  playerLayouts: Map<string, ControllerLayout>;
};

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MAX_PLAYERS = 8;
const DISCONNECT_GRACE_MS = 30_000;
const CLIENT_EVENTS = new Set<string>([
  'session:hello', 'session:reconnect', 'room:create', 'room:join', 'room:leave',
  'room:kick', 'game:start', 'game:input', 'game:message', 'ping',
]);

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.CLIENT_ORIGINS?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true,
  },
  maxHttpBufferSize: 64 * 1024,
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Namespace;

  private readonly logger = new Logger(RealtimeGateway.name);
  private readonly rooms = new Map<string, Room>();
  private readonly sessions = new Map<string, { role: Role; socketId: string }>();
  private readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  handleConnection(client: Socket): void {
    const socket = client as ClientSocket;
    socket.data = {};
    socket.data.authTimer = setTimeout(() => {
      if (!socket.data.role) socket.disconnect(true);
    }, 5_000);
    socket.data.authTimer.unref?.();
    socket.onAny((event: string) => {
      if (!CLIENT_EVENTS.has(event)) {
        this.logger.warn(`Rejected unknown event event=${event.slice(0, 64)} socket=${this.socketTag(socket.id)}`);
        this.sendError(socket, 'error', 'INVALID_PAYLOAD', `Unknown event: ${event.slice(0, 64)}`);
      }
    });
    this.logger.debug(`Socket connected socket=${this.socketTag(socket.id)}`);
  }

  handleDisconnect(client: Socket): void {
    const socket = client as ClientSocket;
    if (socket.data.authTimer) clearTimeout(socket.data.authTimer);
    const sessionToken = socket.data.sessionToken;
    if (sessionToken) {
      const roomCode = socket.data.roomCode;
      const timer = setTimeout(() => {
        if (roomCode) this.removeFromRoom(socket);
        this.sessions.delete(sessionToken);
        this.disconnectTimers.delete(socket.id);
        this.logger.debug(`Session expired after disconnect grace period role=${socket.data.role ?? 'unknown'} room=${roomCode ?? 'none'} socket=${this.socketTag(socket.id)}`);
      }, DISCONNECT_GRACE_MS);
      timer.unref?.();
      this.disconnectTimers.set(socket.id, timer);
    }
    this.logger.debug(`Socket disconnected role=${socket.data.role ?? 'unauthenticated'} room=${socket.data.roomCode ?? 'none'} socket=${this.socketTag(socket.id)}`);
  }

  @SubscribeMessage('session:hello')
  handleHello(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = realtimeClientSchemas['session:hello'].safeParse(input);
    if (!parsed.success) {
      this.logger.warn(`Rejected invalid handshake socket=${this.socketTag(socket.id)}`);
      this.sendError(socket, 'error', 'PROTOCOL_ERROR', 'Invalid or unsupported protocol version', this.details(parsed.error));
      return;
    }
    if (socket.data.role) {
      this.logger.warn(`Rejected duplicate authentication role=${socket.data.role} socket=${this.socketTag(socket.id)}`);
      return this.sendError(socket, 'error', 'CONFLICT', 'Session is already authenticated');
    }

    const role = parsed.data.payload.role;
    const sessionToken = randomUUID() + randomUUID();
    if (socket.data.authTimer) clearTimeout(socket.data.authTimer);
    socket.data = { role, sessionToken };
    this.sessions.set(sessionToken, { role, socketId: socket.id });
    this.emit(socket, 'session:ready', { role, sessionToken });
    this.logger.debug(`Session authenticated role=${role} socket=${this.socketTag(socket.id)}`);
  }

  @SubscribeMessage('room:create')
  handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    if (!this.parseClientEvent(socket, 'room:create', input)) return;
    if (socket.data.role !== 'console') return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only a console can create a room');

    this.leaveRoom(socket);
    const code = this.generateRoomCode();
    const hostId = randomUUID();
    const room: Room = {
      code,
      hostId,
      hostSocketId: socket.id,
      players: new Map(),
      playerLayouts: new Map(),
      status: 'waiting',
    };
    this.rooms.set(code, room);
    socket.data.roomCode = code;
    socket.data.playerId = hostId;
    void socket.join(code);
    this.emit(socket, 'room:created', { roomCode: code, hostId });
    this.broadcastRoomState(room);
    this.logger.debug(`Room created room=${code} host=${this.socketTag(socket.id)}`);
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'room:join', input);
    if (!parsed) return;
    if (socket.data.role !== 'controller') return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only a controller can join as a player');

    const room = this.rooms.get(parsed.payload.roomCode);
    if (!room) return this.sendError(socket, 'error', 'ROOM_NOT_FOUND', 'Room not found');
    if (room.players.size >= MAX_PLAYERS) return this.sendError(socket, 'error', 'ROOM_FULL', 'Room is full');
    this.leaveRoom(socket);

    const player: RoomPlayer = {
      id: randomUUID(),
      name: this.filterNickname(parsed.payload.nickname),
      ...(parsed.payload.avatar ? { avatar: parsed.payload.avatar } : {}),
      socketId: socket.id,
    };
    if (!player.name) return this.sendError(socket, 'error', 'INVALID_PAYLOAD', 'Nickname is empty after filtering');
    room.players.set(player.id, player);
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    void socket.join(room.code);

    this.emit(socket, 'room:joined', {
      roomCode: room.code,
      playerId: player.id,
      hostId: room.hostId,
      players: this.publicPlayers(room),
    });
    socket.to(room.code).emit('player:joined', this.envelope('player:joined', { player: this.publicPlayer(player) }));
    this.broadcastRoomState(room);
    const currentLayout = room.playerLayouts.get(player.id) ?? room.layout;
    if (currentLayout) this.emit(socket, 'game:layout', { layout: currentLayout });
    this.logger.debug(`Controller joined room=${room.code} player=${player.id} players=${room.players.size}/${MAX_PLAYERS}`);
  }

  @SubscribeMessage('session:reconnect')
  handleReconnect(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'session:reconnect', input, false);
    if (!parsed) return;
    const session = this.sessions.get(parsed.payload.sessionToken);
    if (!session) return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Session cannot be resumed');
    if (this.server.sockets.has(session.socketId)) {
      return this.sendError(socket, 'error', 'CONFLICT', 'Session is still connected');
    }
    const timer = this.disconnectTimers.get(session.socketId);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(session.socketId);
    if (socket.data.authTimer) clearTimeout(socket.data.authTimer);
    socket.data = { role: session.role, sessionToken: parsed.payload.sessionToken };
    this.sessions.set(parsed.payload.sessionToken, { ...session, socketId: socket.id });
    let restoredRoom: Room | undefined;
    let restoredPlayerId: string | undefined;
    const room = [...this.rooms.values()].find((candidate) =>
      candidate.hostSocketId === session.socketId ||
      [...candidate.players.values()].some((player) => player.socketId === session.socketId),
    );
    if (room) {
      socket.data.roomCode = room.code;
      const player = [...room.players.values()].find((candidate) => candidate.socketId === session.socketId);
      if (player) {
        player.socketId = socket.id;
        socket.data.playerId = player.id;
        restoredPlayerId = player.id;
      } else if (room.hostSocketId === session.socketId) {
        room.hostSocketId = socket.id;
        socket.data.playerId = room.hostId;
      }
      void socket.join(room.code);
      restoredRoom = room;
    }
    this.emit(socket, 'session:ready', {
      role: session.role,
      sessionToken: parsed.payload.sessionToken,
      ...(socket.data.playerId ? { playerId: socket.data.playerId } : {}),
    });
    if (restoredRoom) {
      this.broadcastRoomState(restoredRoom);
      if (restoredPlayerId) {
        const layout = restoredRoom.playerLayouts.get(restoredPlayerId) ?? restoredRoom.layout;
        if (layout) {
          this.emit(socket, 'game:layout', {
            layout,
            ...(restoredRoom.playerLayouts.has(restoredPlayerId) ? { playerId: restoredPlayerId } : {}),
          });
        }
      }
    }
    this.logger.debug(`Session resumed role=${session.role} room=${restoredRoom?.code ?? 'none'} player=${restoredPlayerId ?? 'host'} socket=${this.socketTag(socket.id)}`);
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    if (!this.parseClientEvent(socket, 'room:leave', input)) return;
    this.leaveRoom(socket);
  }

  @SubscribeMessage('room:kick')
  handleKick(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'room:kick', input);
    if (!parsed) return;
    const room = this.roomForHost(socket);
    if (!room) return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only the room host can remove a player');
    const player = room.players.get(parsed.payload.playerId);
    if (!player) return this.sendError(socket, 'error', 'ROOM_NOT_FOUND', 'Player not found');
    const target = this.server.sockets.get(player.socketId) as ClientSocket | undefined;
    if (target) {
      target.data.roomCode = undefined;
      target.data.playerId = undefined;
      void target.leave(room.code);
      this.sendError(target, 'error', 'UNAUTHORIZED', 'You were removed from the room');
    }
    room.players.delete(player.id);
    this.server.to(room.code).emit('player:left', this.envelope('player:left', { playerId: player.id }));
    this.broadcastRoomState(room);
    this.logger.warn(`Player kicked room=${room.code} player=${player.id} by=${this.socketTag(socket.id)} remaining=${room.players.size}`);
  }

  @SubscribeMessage('game:start')
  handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'game:start', input);
    if (!parsed) return;
    const room = this.roomForHost(socket);
    if (!room) return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only the room host can start a game');
    room.gameId = parsed.payload.gameId;
    room.status = 'playing';
    this.server.to(room.code).emit('game:started', this.envelope('game:started', { gameId: room.gameId }));
    this.broadcastRoomState(room);
    this.logger.debug(`Game started room=${room.code} game=${room.gameId} players=${room.players.size}`);
  }

  @SubscribeMessage('game:input')
  handleControllerInput(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'game:input', input);
    if (!parsed) return;
    if (socket.data.role !== 'controller') return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only controllers can send input');
    const room = socket.data.roomCode ? this.rooms.get(socket.data.roomCode) : undefined;
    const playerId = socket.data.playerId;
    if (!room || !playerId || room.status !== 'playing') return this.sendError(socket, 'error', 'CONFLICT', 'No active game session');
    const action = parsed.payload.action;
    const validation = validateAction(room.playerLayouts.get(playerId) ?? room.layout ?? null, action);
    if (!validation.ok) {
      this.logger.warn(`Rejected controller action room=${room.code} player=${playerId} reason=${validation.reason}`);
      return this.sendError(socket, 'error', 'INVALID_PAYLOAD', `Action rejected: ${validation.reason}`);
    }
    const host = this.server.sockets.get(room.hostSocketId);
    host?.emit('player:action', this.envelope('player:action', { playerId, action }));
  }

  @SubscribeMessage('game:message')
  handleGameMessage(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'game:message', input);
    if (!parsed) return;
    const room = this.roomForHost(socket);
    if (!room) return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only the room host can send game messages');
    this.routeGameMessage(room, parsed.payload);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'ping', input);
    if (parsed) this.emit(socket, 'pong', { id: parsed.payload.id, serverTimestamp: Date.now() });
  }

  private parseClientEvent<K extends RealtimeClientEvent>(
    socket: ClientSocket,
    event: K,
    input: unknown,
    requireAuthentication = true,
  ): z.infer<(typeof realtimeClientSchemas)[K]> | undefined {
    if (requireAuthentication && !socket.data.role) {
      this.sendError(socket, 'error', 'UNAUTHORIZED', 'Send session:hello before other events');
      return undefined;
    }
    const result = realtimeClientSchemas[event].safeParse(input);
    if (!result.success) {
      const protocolError = result.error.issues.some((issue) => issue.path[0] === 'v');
      this.logger.warn(`Rejected client event event=${event} code=${protocolError ? 'PROTOCOL_ERROR' : 'INVALID_PAYLOAD'} socket=${this.socketTag(socket.id)}`);
      this.sendError(socket, 'error', protocolError ? 'PROTOCOL_ERROR' : 'INVALID_PAYLOAD', protocolError ? 'Invalid or unsupported protocol version' : 'Message validation failed', this.details(result.error));
      return undefined;
    }
    return result.data as z.infer<(typeof realtimeClientSchemas)[K]>;
  }

  private routeGameMessage(room: Room, message: ScreenOutbound): void {
    switch (message.type) {
      case 'ready':
      case 'pong':
        return;
      case 'set-controller': {
        if (message.playerId) room.playerLayouts.set(message.playerId, message.layout);
        else room.layout = message.layout;
        const targets = message.playerId
          ? [room.players.get(message.playerId)].filter((player): player is RoomPlayer => Boolean(player))
          : [...room.players.values()];
        for (const player of targets) {
          const socket = this.server.sockets.get(player.socketId);
          socket?.emit('game:layout', this.envelope('game:layout', {
            layout: message.layout,
            ...(message.playerId ? { playerId: message.playerId } : {}),
          }));
        }
        this.logger.debug(`Controller layout updated room=${room.code} target=${message.playerId ?? 'all'} recipients=${targets.length}`);
        return;
      }
      case 'private': {
        const player = room.players.get(message.playerId);
        if (!player) return;
        this.server.sockets.get(player.socketId)?.emit('game:private', this.envelope('game:private', { data: message.data }));
        this.logger.debug(`Private game message routed room=${room.code} player=${player.id}`);
        return;
      }
      case 'lifecycle':
        if (message.phase === 'end') {
          room.status = 'finished';
          this.server.to(room.code).emit('game:ended', this.envelope('game:ended', { gameId: room.gameId }));
          this.broadcastRoomState(room);
          this.logger.debug(`Game ended room=${room.code} game=${room.gameId ?? 'unknown'}`);
        } else if (message.phase === 'start' || message.phase === 'resume') {
          if (!room.gameId) return;
          room.status = 'playing';
          this.server.to(room.code).emit('game:started', this.envelope('game:started', { gameId: room.gameId }));
          this.broadcastRoomState(room);
          this.logger.debug(`Game resumed room=${room.code} game=${room.gameId}`);
        } else if (message.phase === 'pause') {
          room.status = 'paused';
          this.server.to(room.code).emit('game:paused', this.envelope('game:paused', { gameId: room.gameId }));
          this.broadcastRoomState(room);
          this.logger.debug(`Game paused room=${room.code} game=${room.gameId ?? 'unknown'}`);
        }
        return;
      case 'score':
        if (room.players.has(message.playerId)) {
          this.server.to(room.code).emit('game:score', this.envelope('game:score', {
            playerId: message.playerId,
            points: message.points,
          }));
          this.logger.debug(`Score broadcast room=${room.code} player=${message.playerId} points=${message.points}`);
        }
    }
  }

  private leaveRoom(socket: ClientSocket): void {
    const roomCode = socket.data.roomCode;
    const playerId = socket.data.playerId;
    if (!roomCode || !playerId) return;
    const timer = this.disconnectTimers.get(socket.id);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(socket.id);
    const room = this.rooms.get(roomCode);
    socket.data.roomCode = undefined;
    socket.data.playerId = undefined;
    void socket.leave(roomCode);
    if (!room) return;

    const wasHost = room.hostSocketId === socket.id;
    if (playerId !== room.hostId) {
      room.players.delete(playerId);
      room.playerLayouts.delete(playerId);
      this.server.to(room.code).emit('player:left', this.envelope('player:left', { playerId }));
      this.logger.debug(`Player left room=${room.code} player=${playerId} remaining=${room.players.size}`);
    }
    if (wasHost) {
      const nextHost = room.players.values().next().value as RoomPlayer | undefined;
      if (!nextHost) {
        this.rooms.delete(room.code);
        this.server.to(room.code).emit('room:state', this.envelope('room:state', {
          roomCode: room.code, hostId: room.hostId, players: [], status: 'finished',
        }));
        this.logger.debug(`Room closed after host departure room=${room.code}`);
        return;
      }
      room.hostId = nextHost.id;
      room.hostSocketId = nextHost.socketId;
      this.server.to(room.code).emit('host:changed', this.envelope('host:changed', { hostId: room.hostId }));
      this.logger.warn(`Host migrated room=${room.code} newHost=${room.hostId}`);
    }
    this.broadcastRoomState(room);
  }

  private removeFromRoom(socket: ClientSocket): void {
    this.disconnectTimers.delete(socket.id);
    this.leaveRoom(socket);
  }

  private roomForHost(socket: ClientSocket): Room | undefined {
    const room = socket.data.roomCode ? this.rooms.get(socket.data.roomCode) : undefined;
    return room?.hostSocketId === socket.id ? room : undefined;
  }

  private broadcastRoomState(room: Room): void {
    this.server.to(room.code).emit('room:state', this.envelope('room:state', {
      roomCode: room.code,
      hostId: room.hostId,
      players: this.publicPlayers(room),
      ...(room.gameId ? { gameId: room.gameId } : {}),
      status: room.status,
    }));
  }

  private publicPlayers(room: Room): Player[] {
    return [...room.players.values()].map((player) => this.publicPlayer(player));
  }

  private publicPlayer(player: RoomPlayer): Player {
    const { socketId: _socketId, ...publicPlayer } = player;
    return publicPlayer;
  }

  private generateRoomCode(): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = '';
      for (let index = 0; index < 6; index += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Unable to allocate a unique room code');
  }

  private filterNickname(value: string): string {
    return value.normalize('NFKC').replace(/[\p{Cc}<>]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 32);
  }

  private socketTag(socketId: string): string {
    return socketId.slice(0, 8);
  }

  private emit<K extends RealtimeServerEvent>(socket: Socket, event: K, payload: unknown): void {
    const result = realtimeServerSchemas[event].safeParse(this.envelope(event, payload));
    if (result.success) socket.emit(event, result.data);
    else this.logger.error(`Outgoing ${event} payload failed validation`);
  }

  private envelope<K extends RealtimeServerEvent>(event: K, payload: unknown): unknown {
    return { v: PROTOCOL_VERSION, timestamp: Date.now(), payload };
  }

  private sendError(socket: Socket, _event: RealtimeServerEvent, code: string, message: string, details?: string[]): void {
    this.emit(socket, 'error', { code, message, ...(details?.length ? { details } : {}) });
    this.logger.warn(`Server error sent code=${code} socket=${this.socketTag(socket.id)}`);
  }

  private details(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string[] {
    return error.issues.slice(0, 16).map(({ path, message }) => `${path.map(String).join('.') || 'root'}: ${message}`);
  }
}
