import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  const { theme, mode } = await request.json();

  cookies.set('theme', theme || 'classic', { path: '/' });

  cookies.set('theme_mode', mode || 'system', { path: '/' });

  return json({ status: 201 });
}
