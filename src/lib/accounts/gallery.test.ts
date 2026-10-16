import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  groupGalleryPages,
  paletteNameDiffers,
  sharePalette,
  type GalleryPage,
} from './gallery';

const page = (
  postId: number,
  projectId: string,
  publishedAt: number,
  kind?: GalleryPage['kind'],
): GalleryPage => ({
  postId,
  projectId,
  title: `Page ${postId}`,
  publishedAt,
  kind,
});

describe('groupGalleryPages', () => {
  it('shows the newest page of each saved project, its older ones with it', () => {
    const { byProject } = groupGalleryPages(
      [page(1, 'a', 100), page(2, 'a', 300), page(3, 'b', 200)],
      ['a', 'b'],
      [],
    );
    expect(byProject.get('a')?.postId).toBe(2);
    expect(byProject.get('b')?.postId).toBe(3);
  });

  it('leaves out pages whose project or palette is not saved here', () => {
    const { byProject, byPalette } = groupGalleryPages(
      [
        page(1, 'gone', 100),
        page(2, 'gone', 300),
        page(3, 'pal', 200, 'palette'),
      ],
      ['a'],
      [],
    );
    expect(byProject.size).toBe(0);
    expect(byPalette.size).toBe(0);
  });

  it('keeps palettes apart from projects with the same ID', () => {
    const { byProject, byPalette } = groupGalleryPages(
      [page(1, 'x', 100, 'palette'), page(2, 'x', 200, 'project')],
      ['x'],
      ['x'],
    );
    expect(byProject.get('x')?.postId).toBe(2);
    expect(byPalette.get('x')?.postId).toBe(1);
  });

  it('treats pages without a kind as projects', () => {
    const { byProject } = groupGalleryPages([page(1, 'a', 100)], ['a'], []);
    expect(byProject.get('a')?.postId).toBe(1);
  });

  it('breaks a tie in time by the newer post', () => {
    const { byProject } = groupGalleryPages(
      [page(1, 'a', 100), page(2, 'a', 100)],
      ['a'],
      [],
    );
    expect(byProject.get('a')?.postId).toBe(2);
  });
});

describe('paletteNameDiffers', () => {
  const page = (title: string): GalleryPage => ({
    postId: 1,
    projectId: 'pal1',
    title,
    publishedAt: 1,
    kind: 'palette',
  });

  it('compares names as the gallery stores them, not when it was saved', () => {
    // Restoring from the Trash changes updatedAt, never the name
    expect(paletteNameDiffers('Autumn', page('Autumn'))).toBe(false);
    expect(paletteNameDiffers('  Autumn\u200b ', page('Autumn'))).toBe(false);
    expect(paletteNameDiffers('Autumn Mix', page('Autumn'))).toBe(true);
  });

  it('cuts the name to the gallery’s 80 characters first', () => {
    const long = 'x'.repeat(100);
    expect(paletteNameDiffers(long, page('x'.repeat(80)))).toBe(false);
  });
});

describe('sharePalette', () => {
  afterEach(() => vi.unstubAllGlobals());

  const answer = (body: unknown) => {
    vi.stubGlobal('window', { dispatchEvent: () => true });
    vi.stubGlobal(
      'fetch',
      async () => new Response(JSON.stringify(body), { status: 200 }),
    );
    return sharePalette({
      paletteId: 'p1',
      title: 'Autumn',
      yarnUrl: 'https://example.com/yarn?s=1',
      showOwner: false,
    });
  };

  it('says which page has these colors already', async () => {
    expect(
      await answer({
        code: '409',
        message: 'You’ve already published this palette.',
        data: { status: 409, id: 42, title: 'Fall' },
      }),
    ).toEqual({ status: 'published-already', postId: 42, title: 'Fall' });
  });

  it('keeps an older gallery’s 409 an error', async () => {
    expect(
      await answer({
        code: 409,
        message: 'This palette is already in the gallery.',
      }),
    ).toEqual({
      status: 'error',
      message: 'This palette is already in the gallery.',
      code: 409,
    });
  });
});
