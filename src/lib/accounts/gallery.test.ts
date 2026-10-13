import { describe, expect, it } from 'vitest';
import { groupGalleryPages, type GalleryPage } from './gallery';

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
    const { byProject, others } = groupGalleryPages(
      [page(1, 'a', 100), page(2, 'a', 300), page(3, 'b', 200)],
      ['a', 'b'],
      [],
    );
    expect(byProject.get('a')?.postId).toBe(2);
    expect(byProject.get('b')?.postId).toBe(3);
    expect(others).toEqual([]);
  });

  it('lists pages of projects not saved here as others', () => {
    const { byProject, others } = groupGalleryPages(
      [page(1, 'gone', 100)],
      ['a'],
      [],
    );
    expect(byProject.size).toBe(0);
    expect(others.map((p) => p.postId)).toEqual([1]);
  });

  it('keeps palettes apart from projects with the same ID', () => {
    const { byProject, byPalette, others } = groupGalleryPages(
      [page(1, 'x', 100, 'palette'), page(2, 'x', 200, 'project')],
      ['x'],
      ['x'],
    );
    expect(byProject.get('x')?.postId).toBe(2);
    expect(byPalette.get('x')?.postId).toBe(1);
    expect(others).toEqual([]);
  });

  it('treats pages without a kind as projects', () => {
    const { byProject } = groupGalleryPages([page(1, 'a', 100)], ['a'], []);
    expect(byProject.get('a')?.postId).toBe(1);
  });

  it('breaks a tie in time by the newer post', () => {
    const { byProject, others } = groupGalleryPages(
      [page(1, 'a', 100), page(2, 'a', 100)],
      ['a'],
      [],
    );
    expect(byProject.get('a')?.postId).toBe(2);
    expect(others).toEqual([]);
  });
});
