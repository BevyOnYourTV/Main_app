import { describe, expect, it } from 'vitest';
import { RealtimeTesterController } from './realtime-tester.controller.js';

describe('RealtimeTesterController', () => {
  it('serves separate console and controller views with a selectable nickname', () => {
    const html = new RealtimeTesterController().getPage();

    expect(html).toContain('href="?page=console"');
    expect(html).toContain('href="?page=controller"');
    expect(html).toContain('id="nickname"');
    expect(html).toContain('nickname: nickname.value.trim()');
  });
});
