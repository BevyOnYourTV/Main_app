# Realtime Connection Lifecycle

This document describes the current server-side connection flow for a console host and mobile controllers. It follows the Socket.IO events implemented by `RealtimeGateway`.

## Connection details

- Socket.IO namespace: `/realtime`
- Local server URL: `http://localhost:3000/realtime`
- Protocol envelope: `{ v: 0.1, timestamp: number, payload: ... }`
- Every timestamp is a Unix time in milliseconds (`Date.now()`).
- All client events must use the envelope and must be sent after role assignment, except `session:hello` and `session:reconnect`.
- A connection that has not completed `session:hello` within five seconds is disconnected.

`session:hello` is a role handshake, not user or device authentication: the client declares `console` or `controller`, and the server assigns that role to the socket. There are no accounts, passwords, or external identity checks in this server. Authorization is then enforced using the assigned role and room state. Game messages are sent by the console connection that owns the room; there is no separate game socket role.

Example helper:

```ts
const envelope = <T>(payload: T) => ({
  v: 0.1 as const,
  timestamp: Date.now(),
  payload,
})
```

## Full lifecycle

```mermaid
sequenceDiagram
    participant H as Console / Host
    participant S as NestJS Socket.IO Server
    participant C1 as Controller 1
    participant C2 as Controller 2

    H->>S: Connect to /realtime
    H->>S: session:hello { role: console }
    S-->>H: session:ready { sessionToken }
    H->>S: room:create {}
    S-->>H: room:created { roomCode, hostId }
    S-->>H: room:state { players: [], status: waiting }

    C1->>S: Connect to /realtime
    C1->>S: session:hello { role: controller }
    S-->>C1: session:ready { sessionToken }
    C1->>S: room:join { roomCode, nickname }
    S-->>C1: room:joined { playerId, hostId, players }
    S-->>H: player:joined { player }
    S-->>H: room:state { players: [C1], status: waiting }

    C2->>S: session:hello and room:join
    S-->>C2: session:ready and room:joined
    S-->>C1: player:joined { player: C2 }
    S-->>H: player:joined and room:state { players: [C1, C2] }

    H->>S: game:start { gameId }
    S-->>H: game:started and room:state { status: playing }
    S-->>C1: game:started
    S-->>C2: game:started
    H->>S: game:message { type: set-controller, layout }
    S-->>C1: game:layout { layout }
    S-->>C2: game:layout { layout }
    C1->>S: game:input { type: action, action }
    S->>S: Validate action against C1's active layout
    S-->>H: player:action { playerId, action }
```

## 1. Host connects and creates a room

Create a Socket.IO client for the namespace, then authenticate it as the console. The server returns a session token in `session:ready`.

```ts
const host = io('http://localhost:3000/realtime')

host.on('connect', () => {
  host.emit('session:hello', envelope({ role: 'console' }))
})

host.on('session:ready', ({ payload }) => {
  sessionStorage.setItem('realtimeSessionToken', payload.sessionToken)
  host.emit('room:create', envelope({}))
})

host.on('room:created', ({ payload }) => {
  console.log('Room code:', payload.roomCode)
})
```

The server creates a six-character code from an alphabet that avoids `0`, `1`, `I`, and `O`, assigns the host id, and sends:

- `room:created` directly to the host, with `roomCode` and `hostId`.
- `room:state` to the Socket.IO room, with the current players and `status: "waiting"`.

The room and its session state are currently stored in server memory.

Creating another room from the same console first leaves its current room. If it was host, the current room migrates to its first remaining controller, or closes if it has no controllers. Room codes are generated as six characters; incoming codes are trimmed, case-normalized, and validated as 4–6 alphanumeric characters.

## 2. Controllers join

Each phone connects independently, authenticates as a controller, then joins using the room code. The current limit is eight controllers per room.

```ts
const controller = io('http://localhost:3000/realtime')

controller.on('connect', () => {
  controller.emit('session:hello', envelope({ role: 'controller' }))
})

controller.on('session:ready', () => {
  controller.emit('room:join', envelope({
    roomCode: 'U2ZGH4',
    nickname: 'Alex',
    avatar: 'avatar-1', // optional
  }))
})

controller.on('room:joined', ({ payload }) => {
  sessionStorage.setItem('playerId', payload.playerId)
})
```

For each successful join:

- The joining controller receives `room:joined`, including its `playerId`, current `hostId`, and player list.
- Existing room members receive `player:joined` and an updated `room:state`.
- The server normalizes the nickname and removes control characters and angle brackets.

Join payload constraints are: nickname 1–32 characters after trimming, optional avatar up to 64 characters, and no more than eight players in a room. Nicknames are Unicode-normalized, control characters and `<`/`>` are removed, whitespace is collapsed, and the result is trimmed and limited to 32 characters. Avatars are only trimmed and length-checked; the server does not verify that an avatar id exists.

With two controllers, both receive the same room state and each has a different `playerId`.

If a join fails because the room does not exist or is full, the server returns an error and leaves the controller's existing room unchanged. A successful join first removes the controller from its previous room. The server does not reserve nicknames or prevent duplicate display names.

## 3. Host starts a game and defines controls

The host starts a game by id:

```ts
host.emit('game:start', envelope({ gameId: 'demo-game' }))
```

The server sets the room status to `playing` and broadcasts `game:started` and an updated `room:state`.

The host then sends a controller layout using the SDK screen message shape:

```ts
host.emit('game:message', envelope({
  type: 'set-controller',
  layout: {
    components: [
      { kind: 'button', id: 'jump', label: 'Jump' },
      { kind: 'dpad', id: 'move', label: 'Move' },
    ],
  },
}))
```

Every controller receives `game:layout`. To assign a layout to only one controller, include that player's id as `playerId` in the `set-controller` message. The server stores that layout for action validation.

## 4. Controllers send actions

An action uses the SDK controller message shape:

```ts
controller.emit('game:input', envelope({
  type: 'action',
  action: {
    componentId: 'jump',
    value: { kind: 'button', pressed: true },
  },
}))
```

The server checks that:

1. The sender authenticated as a controller and joined a room.
2. The room is currently playing.
3. The component exists in that player's layout and its value kind matches the component.
4. A choice value, if used, selects an option present in the layout.

Accepted input is sent to the host as `player:action` with `playerId` and `action`. Invalid input produces a versioned `error` event.

## 5. Private data, scores and game lifecycle

The host can send data to one player:

```ts
host.emit('game:message', envelope({
  type: 'private',
  playerId: 'PLAYER_ID',
  data: { secret: 'only this player receives it' },
}))
```

Only that player's socket receives `game:private`. The host can report scores with a `score` screen message; the server broadcasts valid scores as `game:score`.

Lifecycle screen messages have these server effects:

| Screen message | Server effect |
|---|---|
| `lifecycle: pause` | Sets room status to `paused`; broadcasts `game:paused` and `room:state`. |
| `lifecycle: resume` | Sets room status to `playing`; broadcasts `game:started` and `room:state`. |
| `lifecycle: end` | Sets room status to `finished`; broadcasts `game:ended` and `room:state`. |

Only the current host socket may send `game:start` or `game:message`. A layout targeted at a player that is not in the room is stored for that player id but has no current recipient. A private message for a player who is not currently in the room is ignored. Scores are broadcast only when their player id belongs to a current room member.

## 6. Leaving, kicking and host migration

A member can leave with an empty `room:leave` envelope:

```ts
controller.emit('room:leave', envelope({}))
```

The server removes that controller and its individual layout, then broadcasts `player:left` and an updated `room:state`. The host can remove a current player with `room:kick`:

```ts
host.emit('room:kick', envelope({ playerId: 'PLAYER_ID' }))
```

The removed controller is taken out of the room and, if still connected, receives `error` with code `UNAUTHORIZED` and message `You were removed from the room`. Other room members receive `player:left` and the updated room state. Kicking removes the current membership; it does not ban the controller from joining again.

When a host leaves voluntarily or its reconnect grace period expires, the first remaining controller becomes host and everyone still in the room receives `host:changed` and a new `room:state`. Host authority follows the promoted socket even though its declared role remains `controller`. If no controllers remain, the room is deleted. A controller leaving does not change the host.

## 7. Ping and connection errors

Use the `ping` event to measure round-trip time:

```ts
host.emit('ping', envelope({ id: Date.now() }))
host.on('pong', ({ payload }) => console.log(payload.id, payload.serverTimestamp))
```

Listen to Socket.IO's `connect`, `disconnect`, and `connect_error` events for transport connection state. Server-side application errors arrive on `error` as an envelope whose payload contains a code and message. The protocol uses these application error codes:

| Code | Meaning |
|---|---|
| `PROTOCOL_ERROR` | Invalid `session:hello` message or unsupported protocol version in a client event. |
| `INVALID_PAYLOAD` | Malformed event payload, unknown event, or controller action that does not match its layout. |
| `ROOM_NOT_FOUND` | Requested room or player does not exist. |
| `ROOM_FULL` | The room already has eight controllers. |
| `UNAUTHORIZED` | Role or host permissions failed, event arrived before role assignment, or a resume token is unknown/expired. |
| `CONFLICT` | Duplicate role handshake, resume attempted while the prior socket remains connected, or controller input without an active game. |
| `RATE_LIMITED` | Reserved in the protocol; rate limiting is not implemented yet. |

Malformed events produce a versioned error and are not applied. Unknown event names also produce `INVALID_PAYLOAD`. Rejected inputs may include up to 16 safe schema issue descriptions in `details`.

## 8. Disconnect and resume a session

The `sessionToken` from `session:ready` can resume a disconnected host or controller for 30 seconds. After reconnecting a new Socket.IO connection, send `session:reconnect` instead of `session:hello`:

```ts
controller.on('connect', () => {
  controller.emit('session:reconnect', envelope({
    sessionToken: sessionStorage.getItem('realtimeSessionToken'),
  }))
})

controller.on('session:ready', ({ payload }) => {
  // playerId is included when the previous room membership was restored.
  console.log('Resumed player:', payload.playerId)
})
```

During the grace period, the server preserves the room slot and player id. A controller's reconnection restores its membership and layout; a host's reconnection restores host authority. A token cannot resume while its previous socket is still connected. A well-formed but unknown or expired token returns `UNAUTHORIZED`; a malformed token envelope returns `INVALID_PAYLOAD`. A still-connected prior socket returns `CONFLICT`. On expiry, the server removes that session and applies the normal leave/host migration behavior. Tokens and rooms are process-local, so a server restart invalidates them immediately.

## Current limitations and implementation details

- Rooms and sessions are in memory; a server restart clears them.
- Reconnection grace is fixed at 30 seconds.
- The five-second authentication deadline and 30-second reconnect grace are fixed constants, not environment settings.
- There is no rate limiting yet.
- Nickname filtering is basic and does not apply a profanity policy to arbitrary game text.
- The console host connection sends game messages; game runtimes do not connect directly with a separate role.
- Session tokens are bearer credentials: anyone holding a valid token can resume that disconnected session during its grace period. Keep them private and avoid logging them.
- Room and session state is not shared between server instances; run one instance unless shared storage/coordination is added.
