import { describe, expect, it } from 'vitest';
import { galleryRequestLink, parseGalleryRequest } from './gallery-request';

const HREF = 'https://example.com/?project=123&v=7.0.0#l=1,20250101,!&u=m';

describe('galleryRequestLink', () => {
  it('adds the request to the query, keeping the hash as it was', () => {
    const link = galleryRequestLink(HREF, { action: 'add', showOwner: true });
    const url = new URL(link);
    expect(url.searchParams.get('project')).toBe('123');
    expect(url.searchParams.get('gallery')).toBe('named');
    expect(url.hash).toBe(new URL(HREF).hash);
  });

  it('round-trips each request', () => {
    for (const request of [
      { action: 'add' },
      { action: 'add', showOwner: true },
      { action: 'replace', postId: 4521 },
    ] as const) {
      const url = new URL(galleryRequestLink(HREF, request));
      expect(parseGalleryRequest(url.searchParams.get('gallery'))).toEqual(
        request,
      );
    }
  });
});

describe('parseGalleryRequest', () => {
  it('leaves the name to the last choice, unless the link asks for it', () => {
    expect(parseGalleryRequest('add')).toEqual({ action: 'add' });
    expect(parseGalleryRequest('named')).toEqual({
      action: 'add',
      showOwner: true,
    });
  });

  it('ignores missing and unknown values', () => {
    for (const value of [null, undefined, '', 'yes', '0', '-3', '1.5', '12a'])
      expect(parseGalleryRequest(value)).toBeNull();
  });
});
