# Realtime server

NestJS + Socket.IO server for the console, mobile controllers and games. The Socket.IO namespace is `/realtime`. All application events use the version `0.2` envelope:

```ts
type Envelope<T> = { v: 0.2; timestamp: number; payload: T }
```

Server validation schemas and inferred event types live in `src/protocol/realtime-protocol.schema.ts`. Their controller action, layout, player and game message constraints mirror the SDK wire shapes. They are defined locally so Node can load the NestJS runtime without trying to execute the SDK's extensionless TypeScript source imports.

## Run locally

From `Main_app/`:

```bash
npm install
npm run start:dev --workspace server
```

The server listens on port `3000` by default. Set `PORT` to change it. `CLIENT_ORIGINS` can be a comma-separated list of allowed browser origins; without it, CORS is open for local development.

## Run with Docker

From `Main_app/`, start the development server with file watching, the Node inspector, and debug logs:

```bash
docker compose -f docker-compose.dev.yml up --buildn  
```

The dev server is available on `http://localhost:3000`, with the inspector on port `9229`. Source changes reload automatically. Override `SERVER_PORT`, `DEBUG_PORT`, or `CLIENT_ORIGINS` as needed. The development tester is enabled by default in this configuration. Stop it with `docker compose -f docker-compose.dev.yml down`.

For the production image, which runs compiled JavaScript without watch mode or the inspector:

```bash
docker compose -f docker-compose.yml up --build
```

Both configurations emit debug level application logs. The production server is available on `http://localhost:3000` and the Socket.IO namespace is `/realtime`. Set `SERVER_PORT` to change the host port. The development tester is disabled by default in production. Stop it with `docker compose -f docker-compose.yml down`.

For a small browser-based test page, enable it explicitly when starting the server:

```bash
ENABLE_REALTIME_TESTER=true npm run start:dev --workspace server
```

Then open `http://localhost:3000/dev/realtime-tester`. It simulates a console and controllers and provides buttons for room creation/join, menu commands, game start, pause/resume/stop, player removal, controller layout, input, ping and session reconnection. The route is not registered unless the environment variable is enabled.

See [the full connection lifecycle guide](./docs/connection-lifecycle.md) for the host and one/two-controller event sequence, payloads, game messaging, and reconnection flow.

## Connect a console

```ts
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000/realtime')
socket.on('session:ready', ({ payload }) => {
  sessionStorage.setItem('sessionToken', payload.sessionToken)
  socket.emit('room:create', { v: 0.2, timestamp: Date.now(), payload: {} })
})
socket.on('room:created', ({ payload }) => console.log(payload.roomCode))
socket.on('room:state', ({ payload }) => renderLobby(payload))
socket.on('player:action', ({ payload }) => handleGameAction(payload.playerId, payload.action))
socket.on('error', ({ payload }) => showServerError(payload))
socket.on('connect', () => {
  socket.emit('session:hello', { v: 0.2, timestamp: Date.now(), payload: { role: 'console' } })
})
```

## Connect a controller

After connecting, send `session:hello` with role `controller`. Once `session:ready` arrives, join using the short code and a nickname:

```ts
socket.emit('room:join', {
  v: 0.2,
  timestamp: Date.now(),
  payload: { roomCode: 'AB12CD', nickname: 'Alex' },
})
socket.on('room:joined', ({ payload }) => savePlayerId(payload.playerId))
socket.on('room:state', ({ payload }) => renderLobby(payload))
socket.on('game:layout', ({ payload }) => renderController(payload.layout))
socket.on('game:private', ({ payload }) => showPrivateGameData(payload.data))
```

Controller actions use the SDK's existing `ControllerOutbound` shape:

```ts
socket.emit('game:input', {
  v: 0.2,
  timestamp: Date.now(),
  payload: { type: 'action', action: { componentId: 'jump', value: { kind: 'button', pressed: true } } },
})
```

## Events

| Direction | Event | Purpose |
|---|---|---|
| Client → server | `session:hello` | Declare this connection's `console` or `controller` role; send before other events. This is a role handshake, not account authentication. |
| Server → client | `session:ready` | Confirms the assigned role and returns a resumable session token. |
| Client → server | `room:create`, `room:join`, `room:leave`, `room:kick` | Create and manage the in-memory lobby. The screen host and current master controller may kick players. |
| Server → clients | `room:created`, `room:joined`, `room:state`, `player:joined`, `player:left`, `host:changed` | Lobby snapshots and changes. |
| Client → server | `game:start` | Screen host or master controller starts a game by id. |
| Master controller → server | `controller:game-control` | Pause, resume, or stop the active game. The server broadcasts the existing lifecycle events and room state. |
| Controller → server → host | `game:input` → `player:action` | Validated controller action, checked against the active layout. |
| Master controller → server → screen host | `controller:command` → `screen:command` | Allowlisted menu command (`up`, `down`, `left`, `right`, `confirm`, `back`). |
| Host → server → controllers | `game:message` → `game:layout`, `game:private`, `game:score`, `game:started`, `game:paused`, `game:ended` | SDK screen messages routed to the room or one player. |
| Client → server → client | `ping` → `pong` | Round-trip latency measurement. |
| Server → client | `error` | Versioned error code and safe validation details. |

## Server logs

Start the server with `LOG_LEVEL=debug` to show routine realtime events in the terminal:

```bash
LOG_LEVEL=debug npm run start:dev --workspace server
```

At the default log level, routine events remain hidden while warnings and errors stay visible. Debug output reports socket connections, authentication, room creation and membership, game lifecycle changes, session resumes/expiry, kicks, host migration, and rejected messages/actions. Entries include relevant room, player, game, or shortened socket ids. Session tokens and private message contents are never logged. Controller actions are not logged individually to keep input traffic from flooding the terminal.

Unknown or malformed events are rejected and produce a versioned `error`; their requested action is not applied. The server rejects application events before the role handshake. Sockets that do not complete `session:hello` within five seconds are disconnected. Socket.IO's reconnect mechanism is supported; clients should listen to `connect`, `disconnect` and `connect_error`. After a new connection, send `session:reconnect` with the token from `session:ready` to resume the same in-memory session and room for up to 30 seconds. This handshake assigns a connection role; it does not verify a user account or device identity. See the [connection lifecycle guide](./docs/connection-lifecycle.md) for authorization, event errors, leave/kick behavior, and reconnect edge cases.

## Current scope and limits

Room state is held in memory, so rooms are lost when the process restarts and this server currently expects a single instance. A room supports up to eight controllers. Disconnected sessions are retained for 30 seconds. Rate limiting, persistent sessions, profanity filtering, inactive-room expiry and load testing remain separate backlog work.
