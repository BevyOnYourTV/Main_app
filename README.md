# AirConsole

AirConsole is a browser-based local multiplayer platform that turns a TV or desktop browser into a shared game console and mobile browsers into controllers. Players join a session from their phones, choose a game on the main display, and play together without installing a dedicated controller app.

This repository contains the main AirConsole application. The current web client is built with React, TypeScript, and Vite and is being developed as a student project.

## Project structure

```text
apps/
  web/    React and TypeScript web application
  server/ Nest js powered node server
packages/
  sdk/ software development kit for the communication between the cotroller, console and games
games/
  testgame/ A test game to showcase the implementation of the sdk
```

The web application is intended to support the shared landing experience, the TV/desktop console, and the mobile controller interface.

## Getting started

### Prerequisites

- A current Node.js release
- npm

### Run the web application

```bash
npm install
cd apps/web
npm run dev
```

Vite prints the local development URL after the server starts.

### Run the realtime server

With Node.js 24, from the repository root:

```bash
npm install
cp .env.example .env
npm run build --workspace @platform/sdk
npm run start:dev --workspace server
```

The server uses port `3000` for HTTP and Socket.IO (`/realtime`). Development debugging uses port `9229`. See the [server configuration and ports](apps/server/README.md#environment-and-ports) for `.env` variables and Docker host port mappings.

### Available checks

From `apps/web`:

```bash
npm run lint
npm run build
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

Security issues must not be reported in a public issue. Follow the private reporting process in [SECURITY.md](SECURITY.md).

## Project status

AirConsole is under active academic development and is not production-ready. Interfaces, architecture, and setup instructions may change as the project evolves.

## License

See [LICENSE](LICENSE) for the repository's license terms.
