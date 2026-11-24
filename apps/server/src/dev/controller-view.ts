export const controllerView = String.raw`
      <section aria-labelledby="controller-heading">
        <h2 id="controller-heading">Controller sessions</h2>
        <div class="fields">
          <label for="roomCode">Room code
            <input id="roomCode" autocomplete="off" maxlength="6" placeholder="Code shown on the main screen">
          </label>
          <label for="nickname">Nickname
            <input id="nickname" autocomplete="nickname" maxlength="32" value="Player 1">
          </label>
          <label for="avatar">Avatar ID (optional)
            <input id="avatar" maxlength="64" placeholder="avatar-1">
          </label>
        </div>
        <div class="actions" style="margin-top:10px">
          <button id="addController" type="button">Connect and join</button>
          <button id="pingAll" type="button" class="secondary">Ping controllers</button>
          <button id="closeAll" type="button" class="secondary">Disconnect controllers</button>
          <button id="attemptNinth" type="button" class="secondary">Attempt ninth player</button>
        </div>
        <p class="hint">Each card owns an independent socket and reconnect token. The server accepts at most eight players in one room. Start a game and send its layout before expecting controller actions to pass validation.</p>
        <div id="controllerList" class="controller-list" aria-live="polite"></div>
      </section>

      <section aria-labelledby="error-heading">
        <h2 id="error-heading">Validation, authorization and boundary attempts</h2>
        <div class="actions">
          <button id="testMissingRoom" type="button" class="secondary">Join a random missing room</button>
          <button id="testUnauthorizedRole" type="button" class="secondary">Controller tries to create room</button>
          <button id="testPreHandshake" type="button" class="secondary">Ping before role handshake</button>
          <button id="testInvalidReconnect" type="button" class="secondary">Reconnect with invalid token</button>
        </div>
        <p class="hint">Use a controller card to try an invalid action.</p>
      </section>`;
