import { json, type RequestHandler } from '@sveltejs/kit';

// Allowed values for each theme cookie. Kept as plain strings here (rather than
// importing the option lists from page-constants.js) so this server route
// doesn't pull the lucide icon components those lists reference into the server
// bundle. Source of truth for the option ids: SKELETON_THEMES / ROUNDNESS /
// SPACING / TEXT_SCALE / HEADING_STYLE in src/lib/constants/page-constants.js.
const ALLOWED = {
  theme: ['classic', 'crimson', 'hamlindigo', 'modern', 'rocket', 'legacy'],
  mode: ['light', 'dark', 'system'],
  roundness: ['sharp', 'rounded', 'pill'],
  spacing: ['compact', 'normal', 'relaxed'],
  textScale: ['small', 'normal', 'large'],
  headingStyle: ['classic', 'playful', 'refined'],
} as const;

const DEFAULTS = {
  theme: 'classic',
  mode: 'system',
  roundness: 'pill',
  spacing: 'normal',
  textScale: 'normal',
  headingStyle: 'classic',
} as const;

type ThemeField = keyof typeof ALLOWED;

/** Return `value` if it's an allowed option for `field`, otherwise the default. */
const validate = (field: ThemeField, value: unknown): string =>
  typeof value === 'string' &&
  (ALLOWED[field] as readonly string[]).includes(value)
    ? value
    : DEFAULTS[field];

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { theme, mode, roundness, spacing, textScale, headingStyle } =
    await request.json();

  cookies.set('theme', validate('theme', theme), { path: '/' });
  cookies.set('theme_mode', validate('mode', mode), { path: '/' });
  cookies.set('theme_roundness', validate('roundness', roundness), {
    path: '/',
  });
  cookies.set('theme_spacing', validate('spacing', spacing), { path: '/' });
  cookies.set('theme_text_scale', validate('textScale', textScale), {
    path: '/',
  });
  cookies.set('theme_heading_style', validate('headingStyle', headingStyle), {
    path: '/',
  });

  return json({ status: 201 });
};
