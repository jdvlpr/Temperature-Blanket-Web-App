import { describe, expect, it } from 'vitest';
import {
  createData,
  linkLine,
  readProjectPost,
  updateData,
  withLinkLine,
  type ProjectPost,
} from './project';

const origin = 'https://temperature-blanket.com';
const link = `${origin}/?project=p1#abc`;

const body = (extra: Record<string, unknown> = {}) => ({
  name: '  My Blanket ',
  craftId: 2,
  statusId: 1,
  started: '2026-01-01',
  finishBy: 'not a date',
  link,
  notes: 'Hello',
  yarns: [
    { name: 'Brand Yarn', colorway: 'Red', ravelryYarnId: 9 },
    { name: 'Other Yarn', colorway: 'Blue' },
    { name: '', colorway: '' },
    'junk',
  ],
  ...extra,
});

const read = (extra?: Record<string, unknown>) =>
  readProjectPost(body(extra), origin, 'p1') as ProjectPost;

describe('readProjectPost', () => {
  it('keeps what it can use and drops the rest', () => {
    const post = read();
    expect(post.name).toBe('My Blanket');
    expect(post.started).toBe('2026-01-01');
    expect(post.finishBy).toBeNull();
    expect(post.yarns).toEqual([
      { name: 'Brand Yarn', colorway: 'Red', ravelryYarnId: 9 },
      { name: 'Other Yarn', colorway: 'Blue' },
    ]);
    expect(post.update).toEqual({
      name: false,
      dates: false,
      status: false,
      notes: false,
    });
  });

  it('only links back to this site and this project', () => {
    expect(
      readProjectPost(
        body({ link: 'https://spam.example/?project=p1' }),
        origin,
        'p1',
      ),
    ).toBeTypeOf('string');
    expect(readProjectPost(body(), origin, 'p2')).toBeTypeOf('string');
    expect(readProjectPost(body({ name: ' ' }), origin, 'p1')).toBeTypeOf(
      'string',
    );
  });
});

describe('notes', () => {
  it('adds the link line once, then replaces it', () => {
    expect(withLinkLine(null, link)).toBe(linkLine(link));
    const once = withLinkLine('Mine\n', link);
    expect(once).toBe(`Mine\n\n${linkLine(link)}`);
    const moved = withLinkLine(once + '\nmore', `${origin}/?project=p1#new`);
    expect(moved).toBe(
      `Mine\n\n${linkLine(`${origin}/?project=p1#new`)}\nmore`,
    );
  });
});

describe('Ravelry data', () => {
  it('posts with yarns, the link line and a tag', () => {
    const data = createData(read());
    expect(data.notes).toBe(`Hello\n\n${linkLine(link)}`);
    expect(data.tag_names).toEqual(['temperature-blanket']);
    expect(data.packs).toEqual([
      { yarn_id: 9, colorway: 'Red' },
      { personal_name: 'Other Yarn', colorway: 'Blue' },
    ]);
  });

  it('updates only the link line unless more is ticked', () => {
    expect(updateData(read(), 'Written on Ravelry')).toEqual({
      notes: `Written on Ravelry\n\n${linkLine(link)}`,
    });
    const all = updateData(
      read({ update: { name: true, dates: true, status: true, notes: true } }),
      'Written on Ravelry',
    );
    expect(all).toMatchObject({
      name: 'My Blanket',
      started: '2026-01-01',
      project_status_id: 1,
      notes: `Hello\n\n${linkLine(link)}`,
    });
  });
});
