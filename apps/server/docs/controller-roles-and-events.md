# Controller Roles and Frontend Events

This guide summarizes the server contract for the screen host, the master controller, and regular controllers. The Socket.IO envelope version is `0.2`:

```ts
type Envelope<T> = { v: 0.2; timestamp: number; payload: T }
```

## Keep the two host identities separate

- `hostId` identifies the screen host. The screen host owns the game runtime and sends `game:message` events.
- `masterControllerId` identifies the elected phone. The first controller to join becomes master; if it leaves permanently, the earliest remaining controller is promoted.
- The master controller is still a player and can send normal game input while the game is playing.
- Screen-host migration and master-controller promotion are separate. A phone may hold both roles after screen-host migration.

Clients receive `masterControllerId` in `room:joined` and `room:state`. Use it to identify which phone should display management controls.

## Screen host (`role: console`)

The screen host creates the room with `room:create`, displays the room code, runs the selected game, and renders the shared screen. It can:

- Start a game with `game:start { gameId }`.
- Kick a player with `room:kick { playerId }`.
- Send controller layouts with `game:message` type `set-controller`, to all players or one player.
- Send player-private data with `game:message` type `private` and publish scores with type `score`.
- Send lifecycle messages with `game:message` type `lifecycle`.
- Receive `player:action` events and apply validated gameplay input to the game.
- Receive `screen:command` and apply its navigation command to the screen UI.

The screen host must remain the only role allowed to send general-purpose `game:message` events.

## Master controller

The master controller keeps all regular player abilities and gains these management actions:

- Navigate the screen UI with `controller:command { command }`. Allowed values: `up`, `down`, `left`, `right`, `confirm`, and `back`. The screen host receives the forwarded `screen:command { controllerId, command }` event.
- Start a game with `game:start { gameId }`.
- Kick a selected player with `room:kick { playerId }`.
- Pause, resume, or stop the current game with `controller:game-control { action }`.

Allowed lifecycle actions and transitions:

| Action | Accepted room status | Result |
|---|---|---|
| `pause` | `playing` | Sets status to `paused`; broadcasts `game:paused` and `room:state`. |
| `resume` | `paused` | Sets status to `playing`; broadcasts `game:started` and `room:state`. |
| `stop` | `playing` or `paused` | Sets status to `finished`; broadcasts `game:ended` and `room:state`. The room stays open. |

Invalid lifecycle transitions return `CONFLICT`. Regular controllers cannot send these management events. The master controller cannot send arbitrary `game:message` events or change controller layouts.

## Regular controller

A regular controller can join with `room:join`, leave with `room:leave`, receive its controller layout, and send `game:input` actions. The server accepts gameplay input only while the room status is `playing` and only when the action matches that player's active layout. Regular controllers cannot start games, kick players, navigate the screen, or control the game lifecycle.

## Server test frontend

All roles and events described above can be exercised through the server's realtime test frontend at `/dev/realtime-tester`. Enable it with `ENABLE_REALTIME_TESTER=true` when starting the server.
