import type { Logger } from '@nestjs/common';
import type { Namespace } from 'socket.io';
import type { ScreenOutbound, RealtimeServerEvent } from '../protocol/realtime-protocol.schema.js';
import type { Room, RoomPlayer } from './realtime.types.js';

export class RealtimeGameRouter {
  constructor(
    private readonly server: Namespace,
    private readonly envelope: (event: RealtimeServerEvent, payload: unknown) => unknown,
    private readonly broadcastRoomState: (room: Room) => void,
    private readonly logger: Logger,
  ) {}

  route(room: Room, message: ScreenOutbound): void {
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
}
