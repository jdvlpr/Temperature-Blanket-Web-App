/** @type {import('./$types').PageServerLoad} */
export function load({ request }) {
  const referer = request.headers.get('referer');

  return {
    referer,
  };
}
