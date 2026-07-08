import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { theme, mode, roundness, spacing, textScale } = await request.json();

  cookies.set('theme', theme || 'classic', { path: '/' });
  cookies.set('theme_mode', mode || 'system', { path: '/' });
  cookies.set('theme_roundness', roundness || 'pill', { path: '/' });
  cookies.set('theme_spacing', spacing || 'normal', { path: '/' });
  cookies.set('theme_text_scale', textScale || 'normal', { path: '/' });

  return json({ status: 201 });
};
