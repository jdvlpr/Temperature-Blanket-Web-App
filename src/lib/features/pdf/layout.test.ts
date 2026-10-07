import { describe, expect, it } from 'vitest';
import {
  Flow,
  MARGIN,
  fitImage,
  gridCells,
  pageBox,
  tableColumns,
} from './layout';
import { defaultPageSize } from './options';

describe('pageBox', () => {
  it('keeps the same margins on A4 and Letter', () => {
    const a4 = pageBox('a4');
    const letter = pageBox('letter');
    expect(a4.left).toBe(MARGIN.side);
    expect(a4.right).toBe(210 - MARGIN.side);
    expect(a4.bottom).toBe(297 - MARGIN.bottom);
    expect(letter.right).toBeCloseTo(215.9 - MARGIN.side);
    expect(letter.bottom).toBeCloseTo(279.4 - MARGIN.bottom);
  });
});

describe('Flow', () => {
  const fakeDoc = () => {
    let pages = 1;
    return {
      addPage: () => (pages += 1),
      get pages() {
        return pages;
      },
    };
  };

  it('starts a page only when something will not fit', () => {
    const doc = fakeDoc();
    const flow = new Flow(doc, pageBox('a4'));
    flow.y += 10;
    expect(flow.ensure(50)).toBe(false);
    flow.y = flow.box.bottom - 5;
    expect(flow.ensure(10)).toBe(true);
    expect(doc.pages).toBe(2);
    expect(flow.y).toBe(flow.box.top);
  });

  it('puts something taller than a page on an empty page anyway', () => {
    const doc = fakeDoc();
    const flow = new Flow(doc, pageBox('a4'));
    expect(flow.ensure(1000)).toBe(false);
    expect(doc.pages).toBe(1);
  });

  it('repeats what each new page needs', () => {
    const doc = fakeDoc();
    const flow = new Flow(doc, pageBox('letter'));
    let headers = 0;
    flow.onNewPage = () => {
      headers += 1;
      flow.y += 8;
    };
    flow.y = flow.box.bottom;
    flow.ensure(5);
    expect(headers).toBe(1);
    expect(flow.y).toBe(flow.box.top + 8);
  });
});

describe('gridCells', () => {
  it('fills the width with equal cards', () => {
    const cells = gridCells(14, 182);
    expect(cells).toHaveLength(3);
    const last = cells[cells.length - 1];
    expect(last.x + last.width).toBeCloseTo(14 + 182);
  });

  it('uses two columns when narrow', () => {
    expect(gridCells(0, 120)).toHaveLength(2);
  });
});

describe('tableColumns', () => {
  it('grows the day column first, then shares the rest', () => {
    const { day, data } = tableColumns(14, 182, { day: 30, data: [20, 20] });
    expect(day.width).toBe(46);
    expect(data[0].width).toBeCloseTo((182 - 46) / 2);
    const last = data[data.length - 1];
    expect(last.x + last.width).toBeCloseTo(14 + 182);
  });

  it('shrinks every column alike when short of room', () => {
    const { day, data } = tableColumns(0, 100, { day: 40, data: [80, 80] });
    expect(day.width).toBeCloseTo(20);
    expect(data[1].width).toBeCloseTo(40);
    expect(data[1].x + data[1].width).toBeCloseTo(100);
  });
});

describe('fitImage', () => {
  it('keeps the shape and fits the box', () => {
    expect(fitImage(200, 100, 100, 100)).toEqual({ width: 100, height: 50 });
    expect(fitImage(100, 400, 100, 100)).toEqual({ width: 25, height: 100 });
  });
});

describe('defaultPageSize', () => {
  it('uses Letter where it is common, A4 elsewhere', () => {
    expect(defaultPageSize('en-US')).toBe('letter');
    expect(defaultPageSize('fr-CA')).toBe('letter');
    expect(defaultPageSize('en-GB')).toBe('a4');
    expect(defaultPageSize('de')).toBe('a4');
    expect(defaultPageSize(undefined)).toBe('a4');
  });
});
