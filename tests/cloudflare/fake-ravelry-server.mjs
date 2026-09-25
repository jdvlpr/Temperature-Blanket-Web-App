// A fake Ravelry OAuth server for the wrangler e2e tests (playwright.cloudflare.config.ts).
// Approves at once as the user in the fake_ravelry_user cookie, which the test sets
// for localhost (cookies ignore ports, so it arrives here too). The profile's email
// is someone else's on purpose: the app must ignore Ravelry emails.

import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_RAVELRY_PORT ?? 8790);

function readBody(request) {
  return new Promise((resolve) => {
    let body = '';
    request.on('data', (chunk) => (body += chunk));
    request.on('end', () => resolve(body));
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(data));
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);

  if (request.method === 'GET' && url.pathname === '/') {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method === 'GET' && url.pathname === '/oauth2/auth') {
    const user = /(?:^|;\s*)fake_ravelry_user=([^;]+)/.exec(
      request.headers.cookie ?? '',
    )?.[1];
    const redirectUri = url.searchParams.get('redirect_uri');
    if (!user || !redirectUri)
      return sendJson(response, 400, { error: 'missing user or redirect_uri' });
    const target = new URL(redirectUri);
    target.searchParams.set('code', `code-${user}`);
    target.searchParams.set('state', url.searchParams.get('state') ?? '');
    response.writeHead(302, { Location: target.toString() });
    return response.end();
  }

  if (request.method === 'POST' && url.pathname === '/oauth2/token') {
    // Ravelry requires Basic client authentication
    if (!request.headers.authorization?.startsWith('Basic '))
      return sendJson(response, 401, { error: 'invalid_client' });
    const code = new URLSearchParams(await readBody(request)).get('code') ?? '';
    if (!code.startsWith('code-'))
      return sendJson(response, 400, { error: 'invalid_grant' });
    return sendJson(response, 200, {
      access_token: `token-${code.slice('code-'.length)}`,
      token_type: 'bearer',
      expires_in: 3600,
    });
  }

  if (request.method === 'GET' && url.pathname === '/current_user.json') {
    const token = /^Bearer token-(.+)$/.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) return sendJson(response, 401, { error: 'unauthorized' });
    return sendJson(response, 200, {
      user: {
        id: Number(token),
        username: `fake-knitter-${token}`,
        email: 'someone-else@example.test',
      },
    });
  }

  sendJson(response, 404, { error: 'not found' });
}).listen(PORT, () => console.log(`Fake Ravelry on http://localhost:${PORT}`));
