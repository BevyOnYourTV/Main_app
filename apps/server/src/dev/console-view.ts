export const consoleView = String.raw`
      <section id="host-panel" aria-labelledby="host-heading">
        <h2 id="host-heading">Console / host</h2>
        <p id="hostStatus" class="status" role="status" aria-live="polite">Connecting to /realtime…</p>
        <div class="fields">
          <label for="roomCode">Room code
            <input id="roomCode" readonly placeholder="Create a room">
          </label>
          <label for="gameId">Game ID
            <input id="gameId" value="test-game" maxlength="64">
          </label>
        </div>
        <div class="actions" style="margin-top:10px">
          <button id="createRoom" type="button" disabled>Create room</button>
          <button id="startGame" type="button" disabled>Start game</button>
          <button id="hostReconnect" type="button" class="secondary">Reconnect host</button>
          <button id="hostLeave" type="button" class="secondary">Leave room (migrate host)</button>
          <button id="hostDisconnect" type="button" class="secondary">Disconnect host</button>
          <button id="pingAll" type="button" class="secondary">Ping server</button>
        </div>
        <div class="summary" aria-live="polite">
          <span>Status: <strong id="roomStatus">No room</strong></span>
          <span>Host: <strong id="currentHost">—</strong></span>
          <span>Players: <strong id="playerCount">0 / 8</strong></span>
        </div>
      </section>

      <section aria-labelledby="game-heading">
        <h2 id="game-heading">Game messages and lifecycle</h2>
        <div class="fields">
          <label for="layoutTarget">Layout recipient
            <select id="layoutTarget"><option value="">All current players</option></select>
          </label>
          <label for="privateTarget">Private message recipient
            <select id="privateTarget"><option value="">Select a player</option></select>
          </label>
          <label for="scoreTarget">Score recipient
            <select id="scoreTarget"><option value="">Select a player</option></select>
          </label>
        </div>
        <div class="actions" style="margin:10px 0">
          <button id="sendLayout" type="button" disabled>Send button, d-pad and choice layout</button>
          <button id="sendPrivate" type="button" disabled>Send private data</button>
          <button id="sendScore" type="button" disabled>Send score</button>
        </div>
        <div class="fields">
          <label for="privateData">Private JSON data
            <textarea id="privateData">{"secret":"visible only to the selected player"}</textarea>
          </label>
          <label for="scorePoints">Score points
            <input id="scorePoints" type="number" step="1" value="10">
          </label>
        </div>
        <div class="actions" style="margin-top:10px" aria-label="Lifecycle actions">
          <button type="button" data-phase="start" class="secondary">Lifecycle start</button>
          <button type="button" data-phase="pause" class="secondary">Pause</button>
          <button type="button" data-phase="resume" class="secondary">Resume</button>
          <button type="button" data-phase="end" class="secondary">End game</button>
          <button id="sendReady" type="button" class="secondary">Send ready (no response expected)</button>
          <button id="sendGamePong" type="button" class="secondary">Send game pong (no response expected)</button>
        </div>
        <p class="hint">Lifecycle start/resume requires a game ID already set by Start game. The ready and pong screen messages are validated no-ops.</p>
      </section>

      <section aria-labelledby="error-heading">
        <h2 id="error-heading">Validation, authorization and boundary attempts</h2>
        <div class="actions">
          <button id="testInvalidEnvelope" type="button" class="secondary">Send unsupported protocol version</button>
          <button id="testPreHandshake" type="button" class="secondary">Ping before role handshake</button>
          <button id="testInvalidReconnect" type="button" class="secondary">Reconnect with invalid token</button>
          <button id="testUnknownPlayer" type="button" class="secondary">Send private data to unknown player</button>
          <button id="testUnknownMessage" type="button" class="secondary">Send invalid game message type</button>
        </div>
        <p class="hint">Messages to unknown players have no acknowledgement.</p>
      </section>`;
