import { describe, expect, it } from 'vitest';
import { parseNotes } from './ravelry-notes';

describe('parseNotes', () => {
  it('keeps paragraphs, breaks, bold, italics and links', () => {
    expect(
      parseNotes(
        '# Done!\n**Bold** and *it*\n\nSee [my blog](https://blog.test/a) or https://x.test/b.',
      ),
    ).toEqual([
      [
        { type: 'text', text: 'Done!' },
        { type: 'break' },
        { type: 'bold', text: 'Bold' },
        { type: 'text', text: ' and ' },
        { type: 'italic', text: 'it' },
      ],
      [
        { type: 'text', text: 'See ' },
        { type: 'link', text: 'my blog', href: 'https://blog.test/a' },
        { type: 'text', text: ' or ' },
        { type: 'link', text: 'https://x.test/b', href: 'https://x.test/b' },
        { type: 'text', text: '.' },
      ],
    ]);
  });

  it('never makes a link of anything but http(s), and leaves HTML as text', () => {
    expect(parseNotes('[x](javascript:alert(1)) <b>hi</b>')).toEqual([
      [{ type: 'text', text: '[x](javascript:alert(1)) <b>hi</b>' }],
    ]);
    expect(parseNotes('')).toEqual([]);
  });
});
