import { Controller, Get, Header } from '@nestjs/common';

@Controller('dev/realtime-tester')
export class RealtimeTesterController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPage(): string {
    return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Socket.IO Realtime Test</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    :root { color-scheme: dark; font: 16px system-ui, sans-serif; background: #10151c; color: #eef3f8; }
    body { max-width: 920px; margin: 32px auto; padding: 0 18px; }
    h1 { margin-bottom: 4px; } p { color: #aab8c7; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(280px,1fr)); gap: 16px; }
    .pages { display: flex; gap: 8px; margin: 18px 0; }
    .pages a { border-radius: 8px; padding: 9px 13px; color: #eef3f8; background: #3a4858; text-decoration: none; }
    .pages a[aria-current="page"] { background: #2868bd; }
    section { background: #19222d; border: 1px solid #344354; border-radius: 12px; padding: 18px; }
    h2 { font-size: 1.1rem; margin: 0 0 12px; }
    button { border: 0; border-radius: 8px; padding: 10px 13px; margin: 4px 3px 4px 0; color: #fff; background: #2868bd; cursor: pointer; }
    button.secondary { background: #3a4858; } button:disabled { opacity: .45; cursor: not-allowed; }
    input { box-sizing: border-box; width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #526275; background: #10151c; color: #fff; margin: 6px 0; }
    .status { color: #9ed8a8; font-size: .9rem; min-height: 1.4em; }
    #log { margin-top: 16px; height: 260px; overflow: auto; background: #080b10; border: 1px solid #344354; border-radius: 10px; padding: 12px; white-space: pre-wrap; font: 13px ui-monospace, monospace; }
    .hint { font-size: .88rem; }
  </style>
</head>
<body>
  <h1>Realtime Server Quick Test</h1>
  <p>Open the console and controller views in separate tabs to test the realtime flow.</p>
  <nav class="pages" aria-label="Tester pages">
    <a id="consolePageLink" href="?page=console">Console page</a>
    <a id="controllerPageLink" href="?page=controller">Controller page</a>
  </nav>
  <div class="grid">
    <section id="consolePage">
      <h2>Console</h2>
      <div id="hostStatus" class="status">Connexion…</div>
      <button id="createRoom">Create Room</button>
      <button id="startGame" disabled>Start Game</button>
      <button id="sendLayout" disabled>Send Jump Layout</button>
      <p class="hint">Controller actions and lobby updates will appear in the event log.</p>
    </section>
    <section id="controllerPage">
      <h2>Controller</h2>
      <div id="controllerStatus" class="status">Not connected</div>
      <label for="roomCode">Room Code</label>
      <input id="roomCode" autocomplete="off" maxlength="6" placeholder="Ex. U2ZGH4">
      <label for="nickname">Pseudo</label>
      <input id="nickname" autocomplete="nickname" maxlength="24" placeholder="Your name" value="Testeur">
      <button id="joinRoom">Connect and Join</button>
      <button id="pressJump" disabled>Press Jump</button>
      <button id="reconnect" class="secondary" disabled>Simulate Disconnect and Reconnect</button>
      <p class="hint">Start the game and receive its layout before testing the button.</p>
    </section>
  </div>
  <section style="margin-top:16px">
    <h2>Event Log</h2>
    <button id="ping" class="secondary">Measure Ping</button>
    <button id="close" class="secondary">Close Connections</button>
    <div id="log" aria-live="polite"></div>
  </section>
<script>
(() => {
  const namespaceUrl = location.origin + '/realtime';
  const version = 0.1;
  const logNode = document.getElementById('log');
  const hostStatus = document.getElementById('hostStatus');
  const controllerStatus = document.getElementById('controllerStatus');
  const roomCode = document.getElementById('roomCode');
  const nickname = document.getElementById('nickname');
  const page = new URLSearchParams(location.search).get('page') === 'controller' ? 'controller' : 'console';
  document.getElementById('consolePage').hidden = page !== 'console';
  document.getElementById('controllerPage').hidden = page !== 'controller';
  document.getElementById(page + 'PageLink').setAttribute('aria-current', 'page');
  let host;
  let controller;
  let hostReady = false;
  let controllerReady = false;
  let controllerToken = '';
  let playerId = '';
  let pingSentAt = 0;
  let controllerHasLayout = false;
  let controllerGameActive = false;

  const envelope = payload => ({ v: version, timestamp: Date.now(), payload });
  const write = (name, data) => {
    const line = new Date().toLocaleTimeString() + '  ' + name + (data === undefined ? '' : '  ' + JSON.stringify(data));
    logNode.textContent = line + '\n' + logNode.textContent;
  };
  const updateControllerActions = () => {
    document.getElementById('pressJump').disabled = !(
      controllerReady && controllerHasLayout && controllerGameActive
    );
  };
  const attachCommonEvents = (socket, label) => {
    socket.on('connect', () => write(label + ' connected', { socketId: socket.id }));
    socket.on('disconnect', reason => write(label + ' disconnected', reason));
    socket.on('connect_error', error => write(label + ' connection error', error.message));
    socket.on('error', message => write(label + ' server error', message.payload));
    socket.on('room:state', message => write(label + ' room state', message.payload));
    socket.on('player:joined', message => write(label + ' player joined', message.payload));
    socket.on('player:left', message => write(label + ' player left', message.payload));
    socket.on('host:changed', message => write(label + ' host changed', message.payload));
    socket.on('game:started', message => write(label + ' game started', message.payload));
    socket.on('game:paused', message => write(label + ' game paused', message.payload));
    socket.on('game:ended', message => write(label + ' game ended', message.payload));
    socket.on('game:score', message => write(label + ' score', message.payload));
    socket.on('pong', message => {
      write(label + ' pong', { id: message.payload.id, allerRetourMs: Date.now() - pingSentAt });
    });
  };

  function connectHost() {
    host = io(namespaceUrl, { autoConnect: false });
    attachCommonEvents(host, 'Console');
    host.on('connect', () => host.emit('session:hello', envelope({ role: 'console' })));
    host.on('session:ready', message => {
      hostReady = true;
      hostStatus.textContent = 'Authenticated — console';
      document.getElementById('createRoom').disabled = false;
      write('Console authenticated', { role: message.payload.role, sessionTokenStored: true });
    });
    host.on('room:created', message => {
      roomCode.value = message.payload.roomCode;
      document.getElementById('startGame').disabled = false;
      document.getElementById('sendLayout').disabled = false;
      write('Room created', message.payload);
    });
    host.on('player:action', message => write('Game received controller action', message.payload));
    host.connect();
  }

  function connectController(resume) {
    controller = io(namespaceUrl, { autoConnect: false });
    attachCommonEvents(controller, 'Controller');
    controller.on('connect', () => {
      if (resume) {
        controller.emit('session:reconnect', envelope({ sessionToken: controllerToken }));
      } else {
        controller.emit('session:hello', envelope({ role: 'controller' }));
      }
    });
    controller.on('session:ready', message => {
      controllerReady = true;
      controllerToken = message.payload.sessionToken;
      if (message.payload.playerId) playerId = message.payload.playerId;
      controllerStatus.textContent = 'Authenticated — controller' + (resume ? ' (session resumed)' : '');
      document.getElementById('reconnect').disabled = false;
      write('Controller authenticated', {
        role: message.payload.role,
        ...(message.payload.playerId ? { playerId: message.payload.playerId } : {}),
        sessionTokenStored: true,
      });
      if (!resume) {
        controller.emit('room:join', envelope({ roomCode: roomCode.value.trim(), nickname: nickname.value.trim() }));
      }
    });
    controller.on('room:joined', message => {
      playerId = message.payload.playerId;
      write('Controller joined room', message.payload);
    });
    controller.on('room:state', message => {
      controllerGameActive = message.payload.status === 'playing';
      updateControllerActions();
    });
    controller.on('game:started', () => {
      controllerGameActive = true;
      updateControllerActions();
    });
    controller.on('game:paused', () => {
      controllerGameActive = false;
      updateControllerActions();
    });
    controller.on('game:ended', () => {
      controllerGameActive = false;
      updateControllerActions();
    });
    controller.on('game:layout', message => {
      controllerHasLayout = true;
      updateControllerActions();
      write('Controller received layout', message.payload);
    });
    controller.on('game:private', message => write('Private message received', message.payload));
    controller.connect();
  }

  document.getElementById('createRoom').disabled = true;
  document.getElementById('createRoom').onclick = () => {
    if (hostReady) host.emit('room:create', envelope({}));
  };
  document.getElementById('joinRoom').onclick = () => {
    if (!roomCode.value.trim()) return write('Enter a room code first');
    if (!nickname.value.trim()) return write('Enter a pseudo first');
    if (!controller || !controller.connected) connectController(false);
    else if (controllerReady) controller.emit('room:join', envelope({ roomCode: roomCode.value.trim(), nickname: nickname.value.trim() }));
  };
  document.getElementById('startGame').onclick = () => host.emit('game:start', envelope({ gameId: 'test-game' }));
  document.getElementById('sendLayout').onclick = () => host.emit('game:message', envelope({
    type: 'set-controller',
    layout: { components: [{ kind: 'button', id: 'jump', label: 'Jump' }] },
  }));
  document.getElementById('pressJump').onclick = () => controller.emit('game:input', envelope({
    type: 'action',
    action: { componentId: 'jump', value: { kind: 'button', pressed: true } },
  }));
  document.getElementById('reconnect').onclick = () => {
    if (!controllerToken) return write('There is no session token to resume');
    controllerStatus.textContent = 'Reconnecting…';
    controller.disconnect();
    controllerReady = false;
    controllerHasLayout = false;
    controllerGameActive = false;
    updateControllerActions();
    setTimeout(() => connectController(true), 400);
  };
  document.getElementById('ping').onclick = () => {
    if (!host || !host.connected) return write('Console is not connected');
    pingSentAt = Date.now();
    host.emit('ping', envelope({ id: pingSentAt }));
  };
  document.getElementById('close').onclick = () => {
    host?.disconnect();
    controller?.disconnect();
    hostReady = false;
    controllerReady = false;
    controllerHasLayout = false;
    controllerGameActive = false;
    hostStatus.textContent = 'Disconnected';
    controllerStatus.textContent = 'Disconnected';
    document.getElementById('createRoom').disabled = true;
    updateControllerActions();
    document.getElementById('reconnect').disabled = true;
  };

  if (typeof io !== 'function') {
    write('Socket.IO client unavailable', 'Check that /socket.io/socket.io.js loads.');
    return;
  }
  if (page === 'console') connectHost();
})();
</script>
</body>
</html>`;
  }
}
