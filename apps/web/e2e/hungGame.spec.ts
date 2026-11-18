import { expect, test } from '@playwright/test'

const hungGame = `<!doctype html>
<title>Hung game</title>
<script>setTimeout(() => { while (true) {} }, 500)</script>`

test('closes a game stuck in an infinite loop', async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Only Chromium was verified to run the game frame in its own process; see docs simulator.md',
  )
  await page.route('**/games/test-game/index.html', (route) =>
    route.fulfill({ body: hungGame, contentType: 'text/html' }),
  )

  await page.goto('/dev/')

  await expect(page.getByRole('alert')).toContainText(
    'The game stopped responding and was closed.',
    { timeout: 15_000 },
  )
  await expect(page.getByTitle('Game')).toHaveCount(0)

  await page.getByRole('button', { name: 'Restart game' }).click()

  await expect(page.getByTitle('Game')).toBeVisible()
})
