import { describe, expect, it } from 'vitest';
import { checkImageFile } from './decode';

describe('checkImageFile', () => {
  it('accepts an image', () => {
    expect(checkImageFile({ type: 'image/jpeg', name: 'a.jpg' })).toEqual({
      ok: true,
      failMessage: "Couldn't open that image. Try a JPG, PNG, or WebP file.",
    });
  });

  it('accepts a HEIC photo by type or name, with its own message', () => {
    for (const file of [
      { type: 'image/heic', name: 'a.heic' },
      { type: '', name: 'IMG_0001.HEIF' },
    ]) {
      const result = checkImageFile(file);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.failMessage).toMatch(/HEIC/);
    }
  });

  it('rejects other files', () => {
    expect(checkImageFile({ type: 'application/pdf', name: 'a.pdf' }).ok).toBe(
      false,
    );
  });
});
