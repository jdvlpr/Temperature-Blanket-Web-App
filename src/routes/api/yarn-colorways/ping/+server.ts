import { json } from '@sveltejs/kit';

export async function GET({ url, request }) {
  return json({
    message: 'OK',
  });
}
