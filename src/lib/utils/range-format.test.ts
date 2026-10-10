import { describe, expect, it } from 'vitest';
import {
  formatRangeEnd,
  formatRangeLabel,
  formatRangeNumber,
  rangeRuleSentence,
} from './range-format';

describe('formatRangeNumber', () => {
  it('uses a real minus sign', () => {
    expect(formatRangeNumber(-5)).toBe('−5');
    expect(formatRangeNumber(0)).toBe('0');
    expect(formatRangeNumber(12.5)).toBe('12.5');
  });
});

describe('formatRangeEnd', () => {
  it('hugs a degree sign and spaces other units', () => {
    expect(formatRangeEnd(72, '°F')).toBe('72°F');
    expect(formatRangeEnd(10, 'mm')).toBe('10 mm');
    expect(formatRangeEnd(3)).toBe('3');
  });
});

describe('formatRangeLabel', () => {
  it('puts From first, then an arrow, then To', () => {
    expect(formatRangeLabel(105, 92, '°F')).toBe('105°F → 92°F');
    expect(formatRangeLabel(-15, -5, 'mm')).toBe('−15 mm → −5 mm');
    expect(formatRangeLabel(0, 10)).toBe('0 → 10');
  });
});

describe('rangeRuleSentence', () => {
  it('says which ends are in each range', () => {
    expect(
      rangeRuleSentence({ includeFromValue: true, includeToValue: false }),
    ).toBe('Each range includes its From number, not its To number.');
    expect(
      rangeRuleSentence({ includeFromValue: false, includeToValue: true }),
    ).toBe('Each range includes its To number, not its From number.');
    expect(
      rangeRuleSentence({ includeFromValue: true, includeToValue: true }),
    ).toBe('Each range includes both its From and To numbers.');
    expect(
      rangeRuleSentence({ includeFromValue: false, includeToValue: false }),
    ).toBe('Each range includes neither its From nor its To number.');
  });

  it('says a rain or snow range ending at 0 includes 0', () => {
    const highToLow = {
      includeFromValue: true,
      includeToValue: false,
      direction: 'high-to-low' as const,
    };
    expect(rangeRuleSentence(highToLow, 'prcp')).toBe(
      'Each range includes its From number, not its To number. A range with a To of 0 includes 0.',
    );
    expect(
      rangeRuleSentence(
        { ...highToLow, direction: 'low-to-high' as const },
        'snow',
      ),
    ).toBe('Each range includes its From number, not its To number.');
    expect(
      rangeRuleSentence(
        {
          includeFromValue: false,
          includeToValue: true,
          direction: 'low-to-high',
        },
        'snow',
      ),
    ).toBe(
      'Each range includes its To number, not its From number. A range with a From of 0 includes 0.',
    );
    expect(rangeRuleSentence(highToLow, 'temp')).toBe(
      'Each range includes its From number, not its To number.',
    );
  });
});
