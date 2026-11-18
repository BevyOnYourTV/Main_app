import { randomInt, randomUUID } from 'node:crypto';
import { Socket } from 'socket.io';
import type { Player } from '../protocol/realtime-protocol.schema.js';
import { CODE_ALPHABET, MAX_PLAYERS, type ClientSocket, type Room, type RoomPlayer } from './realtime.types.js';
import { RealtimeGatewaySessions } from './realtime.gateway-sessions.js';

export class RealtimeGatewayRooms extends RealtimeGatewaySessions {
  handleCreateRoom(client: Socket, input: unknown): void {
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

  handleJoinRoom(client: Socket, input: unknown): void {
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

  handleLeaveRoom(client: Socket, input: unknown): void {
    const socket = client as ClientSocket;
    if (!this.parseClientEvent(socket, 'room:leave', input)) return;
    this.leaveRoom(socket);
  }

  handleKick(client: Socket, input: unknown): void {
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

  protected leaveRoom(socket: ClientSocket): void {
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

  protected roomForHost(socket: ClientSocket): Room | undefined {
    const room = socket.data.roomCode ? this.rooms.get(socket.data.roomCode) : undefined;
    return room?.hostSocketId === socket.id ? room : undefined;
  }

  protected broadcastRoomState(room: Room): void {
    this.server.to(room.code).emit('room:state', this.envelope('room:state', {
      roomCode: room.code,
      hostId: room.hostId,
      players: this.publicPlayers(room),
      ...(room.gameId ? { gameId: room.gameId } : {}),
      status: room.status,
    }));
  }

  protected publicPlayers(room: Room): Player[] {
    return [...room.players.values()].map((player) => this.publicPlayer(player));
  }

  protected publicPlayer(player: RoomPlayer): Player {
    const { socketId: _socketId, ...publicPlayer } = player;
    return publicPlayer;
  }

  protected generateRoomCode(): string {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = '';
      for (let index = 0; index < 6; index += 1) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Unable to allocate a unique room code');
  }

  protected filterNickname(value: string): string {
    return value.normalize('NFKC').replace(/[\p{Cc}<>]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 32);
  }
}
