import { randomUUID } from 'node:crypto';
import { Socket } from 'socket.io';
import { realtimeClientSchemas } from '../protocol/realtime-protocol.schema.js';
import { DISCONNECT_GRACE_MS, CLIENT_EVENTS, type ClientSocket, type Room } from './realtime.types.js';
import { RealtimeGatewayCore } from './realtime.gateway-core.js';

export abstract class RealtimeGatewaySessions extends RealtimeGatewayCore {
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

  handleHello(client: Socket, input: unknown): void {
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

  handleReconnect(client: Socket, input: unknown): void {
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
}
