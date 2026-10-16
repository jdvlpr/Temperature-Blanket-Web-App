import { describe, expect, it } from 'vitest';
import type { RavelryProject } from './api';
import {
  createData,
  linkLine,
  readProjectPost,
  updateData,
  withLinkLine,
  withoutLinkLine,
  yarnKey,
  type ProjectPost,
} from './project';

const link = 'https://temperature-blanket.com/gallery/123';

// A link line from before, cut short by Ravelry at the first ")"
const BROKEN =
  "Planned with [Temperature Blanket](https://t-macbook-pro.tail54df88.ts.net:5173/?project=1783604581266&v=6.0.0#l=4671654'20250101!&temp=Spectral~9e0142(101'97)d8434e(97'94)f67b4a(94'92)fdbf6f(92'90)feeea2(90'86)f1f9a9(86'83)bfe5a0(83'79)75c8a5(79'73)388eba(73'62)5e4fa2(62'19)!alh0f_h&rows=tmax(300)&s=10&u=i)";

const body = (extra: Record<string, unknown> = {}) => ({
  name: '  My Blanket ',
  craftId: 2,
  statusId: 1,
  started: '2026-01-01',
  finishBy: 'not a date',
  notes: 'Hello',
  yarns: [
    { name: 'Brand Yarn', colorway: 'Red', ravelryYarnId: 9 },
    { name: 'Other Yarn', colorway: 'Blue' },
    { name: '', colorway: '' },
    'junk',
  ],
  ...extra,
});

const current = (extra: Partial<RavelryProject> = {}): RavelryProject => ({
  id: 1,
  name: 'My Blanket',
  permalink: 'my-blanket',
  notes: `Hello\n\n${linkLine(link)}`,
  craft_id: 2,
  project_status_id: 1,
  started: '2026-01-01',
  finish_by: null,
  completed: null,
  progress: null,
  ...extra,
});

describe('readProjectPost', () => {
  it('keeps what it can use and drops the rest', () => {
    const post = readProjectPost(body(), { create: true }) as ProjectPost;
    expect(post.name).toBe('My Blanket');
    expect(post.started).toBe('2026-01-01');
    expect(post.finishBy).toBeNull();
    expect(post.yarns).toEqual([
      { name: 'Brand Yarn', colorway: 'Red', ravelryYarnId: 9 },
      { name: 'Other Yarn', colorway: 'Blue' },
    ]);
  });

  it('needs a name to post, and only reads what an update sends', () => {
    expect(readProjectPost({}, { create: true })).toBeTypeOf('string');
    const post = readProjectPost(
      {
        progress: 140,
        packs: { add: [{ name: 'A', colorway: 'B' }], remove: [3, 'x'] },
      },
      { create: false },
    ) as ProjectPost;
    expect(post).toEqual({
      progress: 100,
      packs: { add: [{ name: 'A', colorway: 'B' }], remove: [3] },
    });
  });
});

describe('the link line', () => {
  it('encodes brackets so Ravelry keeps the whole link', () => {
    expect(linkLine('https://x.test/a(1)')).toBe(
      'Planned with [Temperature Blanket](https://x.test/a%281%29)',
    );
  });

  it('replaces a broken line whole, keeping the rest of the notes', () => {
    const notes = `My notes\n\n${BROKEN}\n\nMore`;
    expect(withLinkLine(notes, link)).toBe(
      `My notes\n\n${linkLine(link)}\n\nMore`,
    );
    expect(withoutLinkLine(notes)).toBe('My notes\n\nMore');
    expect(withoutLinkLine(BROKEN)).toBe('');
  });

  it('adds the line when there is none', () => {
    expect(withLinkLine('', link)).toBe(linkLine(link));
    expect(withLinkLine('Hi  ', link)).toBe(`Hi\n\n${linkLine(link)}`);
  });
});

describe('createData', () => {
  it('builds a project with its yarns and the link line', () => {
    const post = readProjectPost(body(), { create: true }) as ProjectPost;
    const data = createData(post, link);
    expect(data.notes).toBe(`Hello\n\n${linkLine(link)}`);
    expect(data.packs).toEqual([
      { yarn_id: 9, colorway: 'Red' },
      { personal_name: 'Other Yarn', colorway: 'Blue' },
    ]);
    expect(data.tag_names).toEqual(['temperature-blanket']);
  });
});

describe('updateData', () => {
  it('sends nothing when nothing changed', () => {
    expect(
      updateData({ name: 'My Blanket', notes: 'Hello' }, link, current()),
    ).toEqual({});
  });

  it('sends only what changed', () => {
    expect(
      updateData(
        { name: 'New', started: '2026-01-01', progress: 50 },
        link,
        current(),
      ),
    ).toEqual({ name: 'New', progress: 50 });
  });

  it('fixes an old link line, keeping the notes written on Ravelry', () => {
    expect(
      updateData({}, link, current({ notes: `Mine\n\n${BROKEN}` })),
    ).toEqual({
      notes: `Mine\n\n${linkLine(link)}`,
    });
  });

  it('replaces the notes, keeping the link line', () => {
    expect(updateData({ notes: 'New notes' }, link, current())).toEqual({
      notes: `New notes\n\n${linkLine(link)}`,
    });
  });
});

describe('yarnKey', () => {
  it('ignores case and spacing', () => {
    expect(yarnKey({ name: ' Brand Yarn', colorway: 'RED ' })).toBe(
      yarnKey({ name: 'brand yarn', colorway: 'red' }),
    );
  });
});
