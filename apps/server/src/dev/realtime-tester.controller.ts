import { Controller, Get, Header } from '@nestjs/common';
import { consoleView } from './console-view.js';
import { controllerView } from './controller-view.js';

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
  <title>Realtime Protocol Tester</title>
  <script src="/socket.io/socket.io.js"></script>
  <style>
    :root { color-scheme: dark; font: 15px/1.5 system-ui, sans-serif; background: #0b1018; color: #edf3fb; }
    * { box-sizing: border-box; }
    body { max-width: 1320px; margin: 0 auto; padding: 24px; }
    h1, h2, h3, h4, p { margin-top: 0; }
    h1 { margin-bottom: 4px; font-size: clamp(1.7rem, 3vw, 2.4rem); }
    h2 { font-size: 1.15rem; margin-bottom: 14px; }
    h3 { font-size: 1rem; margin-bottom: 8px; }
    h4 { font-size: .92rem; margin: 10px 0 4px; }
    .muted, .hint { color: #a8b6c8; }
    .hint { font-size: .86rem; }
    .toolbar, .row, .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .toolbar { justify-content: space-between; margin: 16px 0; }
    .tabs { display: flex; gap: 8px; }
    .tabs a { color: #eaf2fb; padding: 7px 11px; border-radius: 8px; background: #26364a; text-decoration: none; }
    .tabs a[aria-current="page"] { background: #235eaa; }
    .layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, .9fr); gap: 16px; align-items: start; }
    .stack { display: grid; gap: 16px; }
    section, .card { background: #141e2b; border: 1px solid #2b3a4d; border-radius: 13px; padding: 17px; }
    .card { background: #101925; }
    .fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; }
    label { display: block; font-size: .85rem; color: #c6d2e0; }
    input, select, textarea { width: 100%; min-height: 40px; margin-top: 4px; padding: 8px 10px; border: 1px solid #465a72; border-radius: 8px; color: #f4f7fb; background: #0b121c; font: inherit; }
    textarea { min-height: 78px; resize: vertical; }
    button { min-height: 39px; padding: 8px 12px; border: 1px solid transparent; border-radius: 8px; color: white; background: #2469bd; font: inherit; cursor: pointer; }
    button.secondary { background: #2b3b50; border-color: #3d4d61; }
    button.danger { background: #842f39; }
    button:disabled { opacity: .48; cursor: not-allowed; }
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #f4c95d; outline-offset: 2px; }
    .status { min-height: 1.5em; color: #a8e0b2; }
    .status[data-state="error"] { color: #ff9e9e; }
    .status[data-state="pending"] { color: #f4d47d; }
    .summary { display: flex; flex-wrap: wrap; gap: 16px; margin: 10px 0; }
    .summary strong { color: #fff; }
    .controller-list { display: grid; gap: 10px; }
    .card-head { display: flex; justify-content: space-between; align-items: start; gap: 8px; }
    .card-head p { margin-bottom: 0; }
    .control-actions { display: flex; flex-wrap: wrap; gap: 5px; }
    .control-actions button { min-width: 44px; }
    .log-tools { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    #log { height: 360px; overflow: auto; margin: 10px 0 0; padding: 10px; border: 1px solid #26364a; border-radius: 9px; background: #070b11; white-space: pre-wrap; overflow-wrap: anywhere; font: 12px/1.55 ui-monospace, SFMono-Regular, Consolas, monospace; }
    #log li { padding: 3px 0; border-bottom: 1px solid #182330; }
    .tag { display: inline-block; padding: 1px 7px; border-radius: 99px; color: #d5e6ff; background: #273d58; font-size: .78rem; }
    [hidden] { display: none !important; }
    @media (max-width: 800px) { body { padding: 14px; } .layout { grid-template-columns: 1fr; } #log { height: 280px; } }
  </style>
</head>
<body>
  <header>
    <h1 id="pageTitle">Realtime protocol tester</h1>
    <p id="pageHint" class="muted"></p>
  </header>
  <nav class="toolbar" aria-label="Tester sections">
    <div class="tabs">
      <a id="consolePageLink" href="?page=console">Main screen</a>
      <a id="controllerPageLink" href="?page=controller">Controllers</a>
    </div>
    <span id="socketLibraryStatus" class="tag">Connecting…</span>
  </nav>

  <main class="layout">
    <div class="stack">
      <template id="console-view">${consoleView}</template>
      <template id="controller-view">${controllerView}</template>
    </div>

    <aside class="stack">
      <section aria-labelledby="log-heading">
        <div class="log-tools">
          <h2 id="log-heading">Realtime event log</h2>
          <button id="clearLog" type="button" class="secondary">Clear log</button>
        </div>
        <p class="hint">Incoming events and test attempts appear here. Session tokens are omitted.</p>
        <ol id="log" aria-live="polite" aria-relevant="additions"></ol>
      </section>
    </aside>
  </main>

<script>
(() => {
  const namespaceUrl = location.origin + '/realtime';
  const version = 0.2;
  const MAX_LOG_ENTRIES = 300;
  const MAX_PLAYERS = 8;
  const params = new URLSearchParams(location.search);
  const page = params.get('page') === 'controller' ? 'controller' : 'console';
  const isConsole = page === 'console';
  const view = document.getElementById(page + '-view');
  view.replaceWith(view.content.cloneNode(true));
  const title = isConsole ? 'Main screen' : 'Controllers';
  document.title = title + ' · Realtime tester';
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageHint').textContent = isConsole
    ? 'Create a room, then open Controllers in a new tab to join it.'
    : 'Enter the room code from the main screen and connect a player.';
  document.getElementById(page + 'PageLink').setAttribute('aria-current', 'page');
  const otherPage = document.getElementById(isConsole ? 'controllerPageLink' : 'consolePageLink');
  otherPage.target = '_blank';
  otherPage.rel = 'noopener';
  const logNode = document.getElementById('log');
  const hostStatus = document.getElementById('hostStatus');
  const hostStatusText = hostStatus;
  const roomCode = document.getElementById('roomCode');
  if (!isConsole) roomCode.value = (params.get('room') || '').slice(0, 6);
  const nickname = document.getElementById('nickname');
  const avatar = document.getElementById('avatar');
  const controllerList = document.getElementById('controllerList');
  let hostSocket = null;
  let hostToken = '';
  let hostReady = false;
  let roomState = null;
  let nextControllerId = 1;
  let pingSequence = 1;
  const controllers = [];

  const envelope = payload => ({ v: version, timestamp: Date.now(), payload });
  const redact = value => {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') {
      const clean = {};
      Object.keys(value).forEach(key => {
        if (key.toLowerCase().includes('token')) return;
        clean[key] = redact(value[key]);
      });
      return clean;
    }
    return value;
  };
  const write = (name, data) => {
    const item = document.createElement('li');
    const stamp = new Date().toLocaleTimeString();
    item.textContent = stamp + '  ' + name + (data === undefined ? '' : '  ' + JSON.stringify(redact(data)));
    logNode.prepend(item);
    while (logNode.children.length > MAX_LOG_ENTRIES) logNode.lastElementChild.remove();
  };
  const send = (socket, event, payload, label) => {
    if (!socket || !socket.connected) {
      write(label + ' cannot send ' + event + ': socket is disconnected');
      return false;
    }
    socket.emit(event, envelope(payload));
    write(label + ' sent ' + event, payload);
    return true;
  };
  const makeOption = (select, value, label) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  };
  const currentPlayers = () => roomState && Array.isArray(roomState.players) ? roomState.players : [];

  function setStatus(node, text, state) {
    node.textContent = text;
    if (state) node.dataset.state = state;
    else delete node.dataset.state;
  }

  function updateTargets() {
    if (!isConsole) {
      renderControllers();
      return;
    }
    otherPage.href = roomState ? '?page=controller&room=' + encodeURIComponent(roomState.roomCode) : '?page=controller';
    const targets = [
      [document.getElementById('layoutTarget'), true],
      [document.getElementById('privateTarget'), false],
      [document.getElementById('scoreTarget'), false],
    ];
    targets.forEach(([select, allowAll]) => {
      const previous = select.value;
      select.replaceChildren();
      makeOption(select, '', allowAll ? 'All current players' : 'Select a player');
      currentPlayers().forEach(player => makeOption(select, player.id, player.name + ' · ' + player.id.slice(0, 8)));
      if ([...select.options].some(option => option.value === previous)) select.value = previous;
    });
    const count = currentPlayers().length;
    document.getElementById('playerCount').textContent = count + ' / ' + MAX_PLAYERS;
    document.getElementById('roomStatus').textContent = roomState ? roomState.status : 'No room';
    document.getElementById('currentHost').textContent = roomState ? roomState.hostId : '—';
    document.getElementById('startGame').disabled = !hostReady || !roomState;
    document.getElementById('sendLayout').disabled = !hostReady || !roomState;
    document.getElementById('sendPrivate').disabled = !hostReady || !document.getElementById('privateTarget').value;
    document.getElementById('sendScore').disabled = !hostReady || !document.getElementById('scoreTarget').value;
  }

  function attachCommonEvents(socket, label, controller) {
    socket.on('connect', () => write(label + ' connected', { socketId: socket.id }));
    socket.on('disconnect', reason => {
      write(label + ' disconnected', { reason });
      if (controller) {
        controller.connected = false;
        renderControllers();
      } else if (socket === hostSocket) {
        hostReady = false;
        setStatus(hostStatusText, 'Disconnected · reconnect or create a new connection', 'pending');
        updateTargets();
      }
    });
    socket.on('connect_error', error => write(label + ' connection error', { message: error.message }));
    socket.on('error', message => {
      write(label + ' server error', message && message.payload ? message.payload : message);
      if (controller && message && message.payload && message.payload.code === 'UNAUTHORIZED' && /removed from the room/i.test(message.payload.message)) {
        controller.joined = false;
        controller.playerId = '';
        controller.layout = null;
        renderControllers();
      }
    });
    [
      'room:created', 'room:joined', 'room:state', 'player:joined', 'player:left', 'host:changed',
      'player:action', 'screen:command', 'game:started', 'game:paused', 'game:ended', 'game:layout', 'game:private', 'game:score', 'pong',
    ].forEach(event => socket.on(event, message => {
      const payload = message && message.payload ? message.payload : {};
      write(label + ' received ' + event, payload);
      if (event === 'room:created') {
        roomCode.value = payload.roomCode || roomCode.value;
        roomState = { roomCode: payload.roomCode, hostId: payload.hostId, masterControllerId: null, players: [], status: 'waiting' };
        updateTargets();
        setStatus(hostStatusText, 'Connected · room ' + payload.roomCode, '');
      }
      if (event === 'room:joined' && controller) {
        controller.playerId = payload.playerId || '';
        controller.joined = Boolean(payload.playerId);
        controller.roomCode = payload.roomCode || controller.roomCode;
        renderControllers();
      }
      if (event === 'room:state') {
        roomState = payload;
        if (isConsole && payload.roomCode) roomCode.value = payload.roomCode;
        updateTargets();
      }
      if (event === 'game:layout' && controller) {
        if (!payload.playerId || payload.playerId === controller.playerId) {
          controller.layout = payload.layout;
          renderControllers();
        }
      }
      if (event === 'game:started' || event === 'game:paused' || event === 'game:ended') {
        if (roomState) roomState.status = event === 'game:paused' ? 'paused' : event === 'game:ended' ? 'finished' : 'playing';
        updateTargets();
      }
      if (event === 'pong') {
        const sentAt = controller ? controller.pingSentAt : hostPingSentAt;
        if (sentAt) write(label + ' round-trip time', { milliseconds: Date.now() - sentAt, id: payload.id });
      }
    }));
  }

  let hostPingSentAt = 0;
  function connectHost(resume) {
    if (hostSocket) {
      hostSocket.removeAllListeners();
      hostSocket.disconnect();
    }
    hostReady = false;
    hostSocket = io(namespaceUrl, { autoConnect: false });
    const socket = hostSocket;
    attachCommonEvents(socket, 'Console', null);
    socket.on('connect', () => {
      if (resume && hostToken) send(socket, 'session:reconnect', { sessionToken: hostToken }, 'Console');
      else send(socket, 'session:hello', { role: 'console' }, 'Console');
    });
    socket.on('session:ready', message => {
      hostReady = true;
      hostToken = message.payload.sessionToken;
      setStatus(hostStatusText, 'Connected · console role ready', '');
      document.getElementById('createRoom').disabled = false;
      write('Console session ready', { role: message.payload.role, sessionTokenStoredInMemory: true });
      if (resume) write('Console session resume requested; room state will confirm whether the room was restored');
    });
    socket.connect();
  }

  function joinController(controller, roomOverride) {
    const targetRoom = roomOverride || controller.roomCode;
    const payload = { roomCode: targetRoom, nickname: controller.nickname, ...(controller.avatar ? { avatar: controller.avatar } : {}) };
    send(controller.socket, 'room:join', payload, controller.label);
  }

  function makeController(name, avatarValue, roomOverride) {
    const controller = {
      id: nextControllerId++, label: 'Controller ' + nextControllerId,
      nickname: name, avatar: avatarValue, roomCode: roomOverride || roomCode.value.trim(),
      socket: null, token: '', playerId: '', joined: false, connected: false,
      layout: null, pingSentAt: 0, status: 'Connecting…',
    };
    controller.label = 'Controller ' + controller.id + ' (' + name + ')';
    controllers.push(controller);
    connectController(controller, false, roomOverride);
    renderControllers();
    return controller;
  }

  function connectController(controller, resume, roomOverride) {
    if (controller.socket) {
      controller.socket.removeAllListeners();
      controller.socket.disconnect();
    }
    controller.connected = false;
    controller.status = resume ? 'Reconnecting…' : 'Connecting…';
    const socket = io(namespaceUrl, { autoConnect: false });
    controller.socket = socket;
    attachCommonEvents(socket, controller.label, controller);
    socket.on('connect', () => {
      controller.connected = true;
      renderControllers();
      if (resume && controller.token) send(socket, 'session:reconnect', { sessionToken: controller.token }, controller.label);
      else send(socket, 'session:hello', { role: 'controller' }, controller.label);
    });
    socket.on('session:ready', message => {
      controller.token = message.payload.sessionToken;
      controller.connected = true;
      controller.status = resume ? 'Session resumed' : 'Authenticated';
      if (message.payload.playerId) controller.playerId = message.payload.playerId;
      write(controller.label + ' session ready', {
        role: message.payload.role,
        ...(message.payload.playerId ? { playerId: message.payload.playerId } : {}),
        sessionTokenStoredInMemory: true,
      });
      if (!resume) joinController(controller, roomOverride);
      renderControllers();
    });
    socket.connect();
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addActionButton(parent, label, handler, className) {
    const button = element('button', className || 'secondary', label);
    button.type = 'button';
    button.addEventListener('click', handler);
    parent.append(button);
    return button;
  }

  function sendControllerAction(controller, componentId, value) {
    send(controller.socket, 'game:input', { type: 'action', action: { componentId, value } }, controller.label);
  }

  function renderLayout(controller, parent) {
    if (!controller.layout || !Array.isArray(controller.layout.components)) {
      parent.append(element('p', 'hint', 'Waiting for a controller layout from the game host.'));
      return;
    }
    controller.layout.components.forEach(component => {
      const group = element('div', 'action-group');
      group.append(element('h4', '', component.label + ' · ' + component.kind));
      const actions = element('div', 'control-actions');
      if (component.kind === 'button') {
        addActionButton(actions, 'Press', () => {
          sendControllerAction(controller, component.id, { kind: 'button', pressed: true });
          setTimeout(() => sendControllerAction(controller, component.id, { kind: 'button', pressed: false }), 120);
        });
      } else if (component.kind === 'dpad') {
        [['↑', 'up'], ['←', 'left'], ['↓', 'down'], ['→', 'right'], ['Release', 'none']].forEach(([label, direction]) =>
          addActionButton(actions, label, () => sendControllerAction(controller, component.id, { kind: 'dpad', direction })),
        );
      } else if (component.kind === 'choice') {
        const select = document.createElement('select');
        select.setAttribute('aria-label', component.label + ' choice');
        component.options.forEach(option => makeOption(select, option.id, option.label));
        actions.append(select);
        addActionButton(actions, 'Choose', () => sendControllerAction(controller, component.id, { kind: 'choice', optionId: select.value }));
      }
      group.append(actions);
      parent.append(group);
    });
  }

  function renderControllers() {
    controllerList.replaceChildren();
    controllers.forEach(controller => {
      const card = element('article', 'card');
      card.setAttribute('aria-labelledby', 'controller-title-' + controller.id);
      const head = element('div', 'card-head');
      const title = element('div');
      const heading = element('h3', '', controller.label);
      heading.id = 'controller-title-' + controller.id;
      title.append(heading);
      const isMasterController = Boolean(controller.playerId && roomState && roomState.masterControllerId === controller.playerId);
      const status = element('p', 'status', controller.status + (controller.connected ? ' · connected' : ' · offline') + (controller.playerId ? ' · player ' + controller.playerId : '') + (isMasterController ? ' · master controller' : ''));
      status.id = 'controller-status-' + controller.id;
      title.append(status);
      head.append(title);
      addActionButton(head, 'Remove card', () => removeController(controller), 'danger');
      card.append(head);
      const actions = element('div', 'actions');
      addActionButton(actions, 'Reconnect', () => reconnectController(controller));
      addActionButton(actions, 'Leave room', () => send(controller.socket, 'room:leave', {}, controller.label), 'secondary');
      addActionButton(actions, 'Test invalid action', () => sendControllerAction(controller, '__unknown_component__', { kind: 'button', pressed: true }), 'secondary');
      addActionButton(actions, 'Try master controller game:start', () => send(controller.socket, 'game:start', { gameId: 'master-controller-test' }, controller.label), 'secondary');
      const kickTargets = currentPlayers().filter(player => player.id !== controller.playerId && player.id !== roomState?.hostId);
      const kickTarget = document.createElement('select');
      kickTarget.setAttribute('aria-label', 'Player to kick');
      if (kickTargets.length) {
        makeOption(kickTarget, '', 'Select player to kick');
        kickTargets.forEach(player => makeOption(kickTarget, player.id, player.name));
      } else {
        makeOption(kickTarget, '', 'No other players to kick');
        kickTarget.disabled = true;
      }
      actions.append(kickTarget);
      const kickButton = addActionButton(actions, 'Kick selected player', () => {
        if (kickTarget.value) send(controller.socket, 'room:kick', { playerId: kickTarget.value }, controller.label);
      }, 'secondary');
      kickButton.disabled = !kickTargets.length;
      ['up', 'down', 'left', 'right', 'confirm', 'back'].forEach(command => {
        addActionButton(actions, 'Screen: ' + command, () => send(controller.socket, 'controller:command', { command }, controller.label), 'secondary');
      });
      addActionButton(actions, 'Pause game', () => send(controller.socket, 'controller:game-control', { action: 'pause' }, controller.label), 'secondary');
      addActionButton(actions, 'Resume game', () => send(controller.socket, 'controller:game-control', { action: 'resume' }, controller.label), 'secondary');
      addActionButton(actions, 'Stop game', () => send(controller.socket, 'controller:game-control', { action: 'stop' }, controller.label), 'secondary');
      addActionButton(actions, 'Test invalid envelope', () => {
        if (!controller.socket || !controller.socket.connected) return write(controller.label + ' is disconnected');
        controller.socket.emit('game:input', { v: 99, timestamp: Date.now(), payload: { type: 'action', action: { componentId: 'jump', value: { kind: 'button', pressed: true } } } });
        write(controller.label + ' sent game:input with unsupported protocol version');
      }, 'secondary');
      card.append(actions);
      const controls = element('div', 'controller-layout');
      renderLayout(controller, controls);
      card.append(controls);
      controllerList.append(card);
    });
  }

  function removeController(controller) {
    controller.socket && controller.socket.disconnect();
    const index = controllers.indexOf(controller);
    if (index >= 0) controllers.splice(index, 1);
    write(controller.label + ' socket closed and card removed');
    renderControllers();
  }

  function reconnectController(controller) {
    controller.status = 'Reconnecting with the current session token…';
    controller.joined = false;
    renderControllers();
    setTimeout(() => connectController(controller, Boolean(controller.token)), 350);
  }

  function temporaryProbe(label, onReady) {
    if (typeof io !== 'function') return write('Socket.IO browser client is unavailable');
    const probe = io(namespaceUrl, { autoConnect: false, reconnection: false });
    probe.on('error', message => write(label + ' server error', message.payload));
    probe.on('connect_error', error => write(label + ' connection error', error.message));
    probe.on('room:joined', () => {
      send(probe, 'room:leave', {}, label);
      probe.disconnect();
    });
    probe.on('connect', () => onReady(probe));
    probe.connect();
    return probe;
  }

  function testJoin(room, label) {
    const probe = temporaryProbe(label, socket => send(socket, 'session:hello', { role: 'controller' }, label));
    probe.on('session:ready', () => send(probe, 'room:join', { roomCode: room, nickname: label }, label));
    probe.on('error', () => setTimeout(() => probe.disconnect(), 250));
  }

  document.getElementById('pingAll').addEventListener('click', () => {
    const id = pingSequence++;
    hostPingSentAt = Date.now();
    if (isConsole) send(hostSocket, 'ping', { id }, 'Console');
    controllers.forEach(controller => {
      if (controller.socket && controller.socket.connected) {
        controller.pingSentAt = Date.now();
        send(controller.socket, 'ping', { id }, controller.label);
      }
    });
  });
  document.getElementById('clearLog').addEventListener('click', () => logNode.replaceChildren());
  document.getElementById('testPreHandshake').addEventListener('click', () => {
    const probe = temporaryProbe('Pre-handshake probe', socket => send(socket, 'ping', { id: Date.now() }, 'Pre-handshake probe'));
    probe.on('error', () => setTimeout(() => probe.disconnect(), 300));
  });
  document.getElementById('testInvalidReconnect').addEventListener('click', () => {
    const probe = temporaryProbe('Invalid-reconnect probe', socket => send(socket, 'session:reconnect', { sessionToken: 'invalid-session-token' }, 'Invalid-reconnect probe'));
    probe.on('error', () => setTimeout(() => probe.disconnect(), 300));
  });
  if (isConsole) {
    document.getElementById('createRoom').disabled = true;
    document.getElementById('createRoom').addEventListener('click', () => send(hostSocket, 'room:create', {}, 'Console'));
    document.getElementById('startGame').addEventListener('click', () => send(hostSocket, 'game:start', { gameId: document.getElementById('gameId').value.trim() || 'test-game' }, 'Console'));
    document.getElementById('hostReconnect').addEventListener('click', () => connectHost(Boolean(hostToken)));
    document.getElementById('hostLeave').addEventListener('click', () => {
      if (send(hostSocket, 'room:leave', {}, 'Console')) {
        roomState = null;
        roomCode.value = '';
        updateTargets();
        setStatus(hostStatusText, 'Leave request sent · connected controllers will report host migration', 'pending');
      }
    });
    document.getElementById('hostDisconnect').addEventListener('click', () => {
      if (hostSocket) hostSocket.disconnect();
      setStatus(hostStatusText, 'Host disconnected · room migration occurs after the server grace period', 'pending');
    });
    document.getElementById('sendLayout').addEventListener('click', () => {
      const target = document.getElementById('layoutTarget').value;
      const payload = {
        type: 'set-controller',
        layout: { components: [
          { kind: 'button', id: 'jump', label: 'Jump' },
          { kind: 'dpad', id: 'move', label: 'Move' },
          { kind: 'choice', id: 'emote', label: 'Emote', options: [{ id: 'wave', label: 'Wave' }, { id: 'cheer', label: 'Cheer' }, { id: 'laugh', label: 'Laugh' }] },
        ] },
        ...(target ? { playerId: target } : {}),
      };
      send(hostSocket, 'game:message', payload, 'Console');
    });
    document.getElementById('sendPrivate').addEventListener('click', () => {
      const target = document.getElementById('privateTarget').value;
      let data;
      try { data = JSON.parse(document.getElementById('privateData').value); }
      catch { return write('Private data is not valid JSON'); }
      if (target) send(hostSocket, 'game:message', { type: 'private', playerId: target, data }, 'Console');
    });
    document.getElementById('sendScore').addEventListener('click', () => {
      const target = document.getElementById('scoreTarget').value;
      const points = Number(document.getElementById('scorePoints').value);
      if (target && Number.isInteger(points)) send(hostSocket, 'game:message', { type: 'score', playerId: target, points }, 'Console');
      else write('Select a player and enter an integer score');
    });
    document.querySelectorAll('[data-phase]').forEach(button => button.addEventListener('click', () => send(hostSocket, 'game:message', { type: 'lifecycle', phase: button.dataset.phase }, 'Console')));
    document.getElementById('sendReady').addEventListener('click', () => send(hostSocket, 'game:message', { type: 'ready' }, 'Console'));
    document.getElementById('sendGamePong').addEventListener('click', () => send(hostSocket, 'game:message', { type: 'pong', id: Date.now() }, 'Console'));
    document.getElementById('layoutTarget').addEventListener('change', updateTargets);
    document.getElementById('privateTarget').addEventListener('change', updateTargets);
    document.getElementById('scoreTarget').addEventListener('change', updateTargets);
    document.getElementById('testInvalidEnvelope').addEventListener('click', () => {
      if (!hostSocket || !hostSocket.connected) return write('Console is disconnected');
      hostSocket.emit('game:start', { v: 99, timestamp: Date.now(), payload: { gameId: 'invalid-version-test' } });
      write('Console sent game:start with unsupported protocol version');
    });
    document.getElementById('testUnknownPlayer').addEventListener('click', () => send(hostSocket, 'game:message', { type: 'private', playerId: 'unknown-player-target', data: { test: true } }, 'Console'));
    document.getElementById('testUnknownMessage').addEventListener('click', () => send(hostSocket, 'game:message', { type: 'unknown-message-type' }, 'Console'));
  } else {
    document.getElementById('closeAll').addEventListener('click', () => {
      controllers.forEach(controller => controller.socket && controller.socket.disconnect());
      controllers.forEach(controller => { controller.connected = false; controller.status = 'Closed'; });

      write('All active tester sockets disconnected');
      renderControllers();
    });
    document.getElementById('addController').addEventListener('click', () => {
      if (controllers.length >= MAX_PLAYERS) return write('Room capacity is eight controller cards; use Attempt ninth player to check the server rejection');
      if (!roomCode.value.trim()) return write('Enter a room code or create a room before joining a controller');
      if (!nickname.value.trim()) return write('Enter a nickname before joining');
      const enteredController = { nickname: nickname.value.trim(), avatar: avatar.value.trim() };
      makeController(enteredController.nickname, enteredController.avatar, '');
    });
    document.getElementById('attemptNinth').addEventListener('click', () => {
      if (!roomCode.value.trim()) return write('Create a room before testing its player capacity');
      if (currentPlayers().length < MAX_PLAYERS) return write('Add controllers until the room has eight players before attempting a ninth');
      const room = roomCode.value.trim();
      const probe = temporaryProbe('Capacity probe', socket => send(socket, 'session:hello', { role: 'controller' }, 'Capacity probe'));
      probe.on('session:ready', () => send(probe, 'room:join', { roomCode: room, nickname: 'Capacity probe' }, 'Capacity probe'));
      probe.on('error', message => {
        const payload = message && message.payload;
        if (payload && payload.code === 'ROOM_FULL') write('Capacity boundary confirmed: server returned ROOM_FULL');
        setTimeout(() => probe.disconnect(), 300);
      });
    });
    document.getElementById('testMissingRoom').addEventListener('click', () => {
      const missing = 'ZZ' + Math.random().toString(36).slice(2, 6).toUpperCase();
      write('Attempting join to a random room code expected not to exist', { roomCode: missing });
      testJoin(missing, 'Missing-room probe');
    });
    document.getElementById('testUnauthorizedRole').addEventListener('click', () => {
      const probe = temporaryProbe('Unauthorized-role probe', socket => send(socket, 'session:hello', { role: 'controller' }, 'Unauthorized-role probe'));
      probe.on('session:ready', () => send(probe, 'room:create', {}, 'Controller role probe'));
      probe.on('error', () => setTimeout(() => probe.disconnect(), 300));
    });
  }

  if (typeof io !== 'function') {
    document.getElementById('socketLibraryStatus').textContent = 'Socket.IO client unavailable';
    if (isConsole) setStatus(hostStatusText, 'Cannot connect: /socket.io/socket.io.js did not load', 'error');
    write('Socket.IO client unavailable; check that the server serves /socket.io/socket.io.js');
    return;
  }
  document.getElementById('socketLibraryStatus').textContent = 'Socket.IO loaded';
  if (isConsole) connectHost(false);
})();
</script>
</body>
</html>`;
  }
}
