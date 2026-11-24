import { Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { z } from 'zod';
import { PROTOCOL_VERSION, realtimeClientSchemas, realtimeServerSchemas, type RealtimeClientEvent, type RealtimeServerEvent } from '../protocol/realtime-protocol.schema.js';
import { type ClientSocket, type Role, type Room } from './realtime.types.js';

export abstract class RealtimeGatewayCore {
  @WebSocketServer()
  protected server!: Namespace;

  protected readonly logger = new Logger('RealtimeGateway');
  protected readonly rooms = new Map<string, Room>();
  protected readonly sessions = new Map<string, { role: Role; socketId: string }>();
  protected readonly disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

  protected abstract leaveRoom(socket: ClientSocket): void;
  protected abstract broadcastRoomState(room: Room): void;

  protected parseClientEvent<K extends RealtimeClientEvent>(
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

  protected removeFromRoom(socket: ClientSocket): void {
    this.disconnectTimers.delete(socket.id);
    this.leaveRoom(socket);
  }

  protected socketTag(socketId: string): string {
    return socketId.slice(0, 8);
  }

  protected emit<K extends RealtimeServerEvent>(socket: Socket, event: K, payload: unknown): void {
    const result = realtimeServerSchemas[event].safeParse(this.envelope(event, payload));
    if (result.success) socket.emit(event, result.data);
    else this.logger.error(`Outgoing ${event} payload failed validation`);
  }

  protected envelope<K extends RealtimeServerEvent>(event: K, payload: unknown): unknown {
    return { v: PROTOCOL_VERSION, timestamp: Date.now(), payload };
  }

  protected sendError(socket: Socket, _event: RealtimeServerEvent, code: string, message: string, details?: string[]): void {
    this.emit(socket, 'error', { code, message, ...(details?.length ? { details } : {}) });
    this.logger.warn(`Server error sent code=${code} socket=${this.socketTag(socket.id)}`);
  }

  protected details(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string[] {
    return error.issues.slice(0, 16).map(({ path, message }) => `${path.map(String).join('.') || 'root'}: ${message}`);
  }
}
