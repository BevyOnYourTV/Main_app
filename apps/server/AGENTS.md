# Working on the BevyOnYourTV server

This directory contains the NestJS server that connects the game host, game runtime, and player controllers over Socket.IO. Keep server work within `apps/server/` unless the user explicitly asks for changes elsewhere.

## Start here

Before changing behavior:

1. Inspect the current working tree and preserve unrelated user changes.
2. Read [README.md](README.md) and [docs/connection-lifecycle.md](docs/connection-lifecycle.md) for the current setup and connection flow.
3. Trace the relevant event from its schema through the gateway to its emitted response. Do not infer runtime behavior from a type or document alone.
4. Check the current tests and package scripts before choosing validation commands.

The implementation can change. Treat the source and tests in this checkout as the evidence for current behavior, and update documentation when a behavior change makes it inaccurate.

## Choose the requested workflow

| Request | Approach |
| --- | --- |
| Explain behavior | Trace the current event and state transitions, then answer with the relevant event names and limitations. |
| Review or audit | Inspect the requested scope and report findings with file and line references, impact, and reproduction conditions. Do not modify files unless asked. |
| Implement or fix | Follow the event path across schemas, authorization, state changes, emissions, and tests. Make the smallest change that completes the request. |
| Test or verify | Run the requested checks and report each command and its result. Separate passing checks from checks not run or blocked. |

Do not claim an issue is fixed, a protocol is compatible, or a scenario is covered without checking the relevant implementation and evidence.

## Engineering rules

- This is a NestJS 12, TypeScript, ESM, Socket.IO server. Follow the existing patterns before adding dependencies or introducing another abstraction.
- Relative TypeScript imports include the `.js` extension. Tests use Vitest (`vi`), not Jest.
- Treat every client event as untrusted. Validate its versioned envelope and payload with the server event schemas and shared SDK schemas before using it.
- The server owns session identity, room membership, host authority, game status, and player identity. Derive permissions from authenticated socket state and server state; never trust client-supplied role, host, player, or room claims without checking them.
- Keep all wire events versioned with the established envelope (`v`, `timestamp`, `payload`). When changing a wire shape or event, update both directions as applicable, the relevant tests, and the connection documentation.
- Preserve the public event names and payload shapes unless the request explicitly calls for a protocol change. Check the SDK contract before changing compatibility-sensitive behavior.
- Do not log session tokens, full private game messages, or raw action streams. Keep routine lifecycle details at debug level, rejected or suspicious requests at warn, and actual failures at error. User-facing strings, logs, comments, and documentation must be in English.
- Room and session state currently lives in process memory. Do not describe it as durable or shared across server instances. Changes to persistence or multi-instance behavior require an explicit design and compatibility review.
- Keep the development tester opt-in: `/dev/realtime-tester` is registered only when `ENABLE_REALTIME_TESTER=true`.

## Architecture map

| File | Responsibility |
| --- | --- |
| `src/main.ts` | Nest bootstrap, HTTP port, and log level configuration. |
| `src/app.module.ts` | Registers the HTTP controller, realtime gateway, and optional development tester. |
| `src/realtime/realtime.gateway.ts` | Socket.IO namespace `/realtime`; authentication, reconnects, rooms, player membership, game lifecycle, routing, and server-side in-memory state. |
| `src/protocol/realtime-protocol.schema.ts` | Versioned Socket.IO envelopes, event payload maps, and server error schemas. Shared SDK message schemas and types are imported from `@platform/sdk`. |
| `src/protocol/zod-ws-validation.pipe.ts` | Converts Zod validation failures into the established websocket error response. |
| `@platform/sdk` `validateAction` | Checks controller actions against the active controller layout. |
| `src/dev/realtime-tester.controller.ts` | Optional browser-based console/controller tester. |
| `src/realtime/realtime.gateway.spec.ts` | Gateway lifecycle, authorization, routing, and state behavior tests. |
| `src/protocol/realtime-protocol.spec.ts` | Protocol schema and action validation tests. |
| `test/app.e2e-spec.ts` | HTTP application end-to-end checks. |
| `docs/connection-lifecycle.md` | Console host and controller connection lifecycle, including game message routing. |

Typical event flow: a client sends a versioned event to the `/realtime` namespace; the gateway validates the envelope and payload, checks role and current server state, changes state if allowed, then emits a versioned response or an `error` event. For any change, follow this whole path rather than editing only the schema or UI.

## Change impact matrix

| Change | Inspect and update |
| --- | --- |
| Event name, envelope, or payload | `src/protocol/realtime-protocol.schema.ts`, gateway handling/emission, SDK contract, protocol and gateway specs, and connection docs. |
| Authentication, reconnect, or session expiry | Gateway handshake/disconnect/reconnect paths, session tests, and lifecycle docs. Never expose session tokens in logs. |
| Room membership, capacity, host changes, or kick/leave | Gateway room state and broadcasts, authorization checks, gateway specs, and lifecycle docs. |
| Game start/status or message routing | Gateway game-state checks and recipient selection, protocol schemas, gateway specs, and lifecycle docs. |
| Layout or controller action validation | SDK protocol schemas and `validateAction`, gateway input path, protocol/gateway specs, and the tester if its controls are affected. |
| Tester page or availability | `src/dev/realtime-tester.controller.ts`, conditional registration in `src/app.module.ts`, and README setup instructions. Keep it disabled by default. |
| Startup, configuration, or log levels | `src/main.ts`, relevant module behavior, and README configuration. |

## Trust boundaries

| Input or boundary | Required handling |
| --- | --- |
| Socket.IO handshake and event payloads | Enforce authentication timeout, envelope version, schema validation, and size limits. Reject unknown or malformed events safely. |
| Role and session token | Issue server-side during `session:hello`; look up reconnect credentials in server state and preserve the reconnect grace behavior. Do not accept role claims as proof of authorization. |
| Room/player identifiers | Resolve against current server state and verify the caller's role and membership before acting. |
| Controller actions and game layouts | Validate shape and ensure actions target a component/option permitted by the active layout before forwarding them. |
| Game messages and private data | Validate message shape and route private messages only to the intended player's socket. Do not leak message bodies in logs or to other room members. |
| Nicknames and avatar identifiers | Apply schema constraints and existing filtering before broadcasting player information. |

## Validation and maintenance

Run commands from the repository root (`Main_app`) when checking server changes:

```sh
npm run test --workspace server
npm run build --workspace server
npm run lint --workspace server
npm run test:e2e --workspace server
```

Choose the smallest checks that cover the change, plus the broader checks requested by the user. The end-to-end script may need permission to bind a local port; report if the environment prevents it. Do not add or run checks for a documentation-only change unless the user asks for verification.

For manual realtime testing, start the server with `npm run start:dev --workspace server`. Set `LOG_LEVEL=debug` to see debug lifecycle logs. Set `ENABLE_REALTIME_TESTER=true` to register `/dev/realtime-tester`; restart Nest after changing environment variables. The tester and server must be pointed at the same running server.

## Definition of done

- The requested server behavior is implemented without unrelated changes outside `apps/server/`.
- Authorization and state transitions are checked on the server, and event payloads retain the protocol's validation and envelope rules.
- Relevant tests and documentation reflect the resulting behavior.
- Validation results are reported accurately, including commands not run and any environmental limitation.
- No secrets, session tokens, raw private message bodies, or generated build artifacts are added to source control.

## Generated and dependency-managed files

Do not edit `node_modules/`, build output such as `dist/`, lockfiles, or generated files by hand to implement application behavior. Change source and manifests intentionally, and regenerate managed output only through the project's existing tooling when needed.
