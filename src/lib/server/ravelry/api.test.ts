import { describe, expect, it, vi } from 'vitest';
import { imageIdOf, ravelryApi, RavelryApiError } from './api';

describe('ravelryApi', () => {
  it('sends the token and data=<JSON> as a form, and reads the result', async () => {
    const fetchFn = vi.fn(async () =>
      Response.json({ project: { id: 1, name: 'B', permalink: 'b' } }),
    );
    const api = ravelryApi('token', fetchFn as unknown as typeof fetch);
    const project = await api.createProject('a b', { name: 'B' });
    expect(project.id).toBe(1);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('https://api.ravelry.com/projects/a%20b/create.json');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer token',
    );
    const form = init.body as URLSearchParams;
    expect(form).toBeInstanceOf(URLSearchParams);
    expect(JSON.parse(form.get('data') ?? '')).toEqual({ name: 'B' });
  });

  it('says to reconnect on 401', async () => {
    const api = ravelryApi(
      'token',
      (async () => new Response('', { status: 401 })) as typeof fetch,
    );
    const error = await api.currentUser().catch((e) => e);
    expect(error).toBeInstanceOf(RavelryApiError);
    expect(error.reconnect).toBe(true);
  });

  it('reads image_id from either upload result shape', () => {
    expect(imageIdOf({ file0: { image_id: 16 } })).toBe(16);
    expect(imageIdOf([{ file0: { image_id: 17 } }])).toBe(17);
    expect(() => imageIdOf({})).toThrow(RavelryApiError);
  });
});
