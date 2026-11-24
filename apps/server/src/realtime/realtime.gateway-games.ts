import { Socket } from 'socket.io';
import { validateAction } from '@platform/sdk';
import { type ClientSocket } from './realtime.types.js';
import { RealtimeGatewayRooms } from './realtime.gateway-rooms.js';
import { RealtimeGameRouter } from './realtime.game-router.js';

export class RealtimeGatewayGames extends RealtimeGatewayRooms {
  handleStartGame(client: Socket, input: unknown): void {
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

  handleControllerInput(client: Socket, input: unknown): void {
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

  handleGameMessage(client: Socket, input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'game:message', input);
    if (!parsed) return;
    const room = this.roomForHost(socket);
    if (!room) return this.sendError(socket, 'error', 'UNAUTHORIZED', 'Only the room host can send game messages');
    new RealtimeGameRouter(
      this.server,
      (event, payload) => this.envelope(event, payload),
      (targetRoom) => this.broadcastRoomState(targetRoom),
      this.logger,
    ).route(room, parsed.payload);
  }

  handlePing(client: Socket, input: unknown): void {
    const socket = client as ClientSocket;
    const parsed = this.parseClientEvent(socket, 'ping', input);
    if (parsed) this.emit(socket, 'pong', { id: parsed.payload.id, serverTimestamp: Date.now() });
  }
}
