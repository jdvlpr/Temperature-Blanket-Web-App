import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const { theme, mode } = await request.json();

  cookies.set('theme', theme || 'classic', { path: '/' });

  cookies.set('theme_mode', mode || 'system', { path: '/' });

  return json({ status: 201 });
};
