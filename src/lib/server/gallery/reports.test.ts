import { createTestD1 } from '#lib/server/test-d1.js';
import { describe, expect, it, vi } from 'vitest';
import {
  allowPublishing,
  countNewReportedPages,
  hideReportedPage,
  listReportedPages,
  parseReport,
  saveReport,
  setReportsStatus,
  stopPublishing,
} from './reports';
import { getSettings, listPosts, postsForItem, recordPost } from './store';
import { matchGalleryToItem } from './visibility';
import type { GalleryApi } from './wordpress';

async function setup() {
  const { d1, sqlite } = createTestD1();
  const now = new Date().toISOString();
  for (const id of ['reporter', 'ada'])
    sqlite.exec(
      `insert into "user" values ('${id}', '${id}', '${id}@example.test', 1, null, '${now}', '${now}')`,
    );
  for (const postId of [1, 2])
    await recordPost(d1, 'ada', {
      postId,
      projectId: `p${postId}`,
      title: `Page ${postId}`,
      publishedAt: postId,
    });
  const api = {
    trash: vi.fn(async () => 'ok' as const),
    restore: vi.fn(async () => 'ok' as const),
  } as unknown as GalleryApi;
  return { d1, api };
}

const report = (
  postId: number,
  reason = 'words',
  email: string | null = null,
) => {
  const parsed = parseReport({
    postId,
    kind: 'project',
    reason,
    message: ' Rude ',
    email,
  });
  if (!parsed.ok) throw new Error(parsed.message);
  return parsed.report;
};

describe('gallery reports', () => {
  it('checks what’s sent', () => {
    expect(parseReport({ postId: 1, kind: 'project', reason: 'nope' }).ok).toBe(
      false,
    );
    expect(
      parseReport({ postId: -1, kind: 'project', reason: 'spam' }).ok,
    ).toBe(false);
    expect(
      parseReport({ postId: 1, kind: 'project', reason: 'spam', email: 'x' })
        .ok,
    ).toBe(false);
    expect(report(1).message).toBe('Rude');
  });

  it('takes a signed-in reporter’s report of a page once, and guests’ each time', async () => {
    const { d1 } = await setup();
    expect(await saveReport(d1, report(1), 'reporter', 1)).toBe('saved');
    expect(await saveReport(d1, report(1, 'spam'), 'reporter', 2)).toBe(
      'reported-already',
    );
    expect(
      await saveReport(d1, report(1, 'spam', 'g@example.test'), null, 3),
    ).toBe('saved');
    expect(await saveReport(d1, report(1, 'other'), null, 4)).toBe('saved');
    expect(await countNewReportedPages(d1)).toBe(1);

    const [page] = await listReportedPages(d1, 'new');
    expect(page).toMatchObject({
      postId: 1,
      title: 'Page 1',
      hasPublisher: true,
      newCount: 3,
      hidden: false,
    });
    expect(page.reports.map((r) => r.email)).toEqual([
      null,
      'g@example.test',
      'reporter@example.test',
    ]);
  });

  it('dismisses a page’s new reports', async () => {
    const { d1 } = await setup();
    await saveReport(d1, report(1), null);
    await setReportsStatus(d1, 1, 'dismissed');
    expect(await countNewReportedPages(d1)).toBe(0);
    expect(await listReportedPages(d1, 'new')).toEqual([]);
    expect((await listReportedPages(d1))[0].reports[0].status).toBe(
      'dismissed',
    );
  });

  it('hides a page as its publisher, and restoring its item doesn’t bring it back', async () => {
    const { d1, api } = await setup();
    await saveReport(d1, report(1), null);
    expect(await hideReportedPage(d1, api, 1, 50)).toBe('hidden');
    expect(api.trash).toHaveBeenCalledWith(1, 'ada');
    expect((await listPosts(d1, 'ada')).map((p) => p.postId)).toEqual([2]);
    expect(await postsForItem(d1, 'ada', 'project', 'p1')).toEqual([
      { postId: 1, hidden: true, moderated: true },
    ]);
    await matchGalleryToItem(d1, api, 'ada', 'project', 'p1', 'live');
    expect(api.restore).not.toHaveBeenCalled();
    expect((await listReportedPages(d1))[0]).toMatchObject({
      hidden: true,
      newCount: 0,
    });
  });

  it('can’t hide a page published without an account from here', async () => {
    const { d1, api } = await setup();
    await saveReport(d1, report(99), null);
    expect(await hideReportedPage(d1, api, 99)).toBe('no-publisher');
    expect((await listReportedPages(d1))[0].hasPublisher).toBe(false);
  });

  it('stops a publisher publishing and hides all their pages, until allowed again', async () => {
    const { d1, api } = await setup();
    await saveReport(d1, report(2), null);
    expect(await stopPublishing(d1, api, 2, 60)).toEqual({ hidden: 2 });
    expect(await listPosts(d1, 'ada')).toEqual([]);
    expect((await getSettings(d1, 'ada')).publishingStopped).toBe(true);
    expect((await listReportedPages(d1))[0].publishingStopped).toBe(true);
    expect(await allowPublishing(d1, 2)).toBe(true);
    expect((await getSettings(d1, 'ada')).publishingStopped).toBe(false);
  });
});
