import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_SHOW_PLATFORM,
  SHOW_PLATFORM_OPTIONS,
  formatShowPlatformLabel,
} from './showPlatformOptions.ts';

describe('showPlatformOptions', () => {
  it('lists TikTok first and as the default platform', () => {
    const values = SHOW_PLATFORM_OPTIONS.map((o) => o.value);
    assert.deepEqual(values, ['TIKTOK', 'WHATNOT', 'INSTAGRAM', 'OTHER']);
    assert.equal(SHOW_PLATFORM_OPTIONS[0]?.value, 'TIKTOK');
    assert.equal(DEFAULT_SHOW_PLATFORM, 'TIKTOK');
  });

  it('formats TikTok label', () => {
    assert.equal(formatShowPlatformLabel('TIKTOK'), 'TikTok');
  });
});
