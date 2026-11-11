import { describe, expect, it } from 'vitest';
import { OPEN_METEO_BUSY_MESSAGE, fetchOpenMeteo } from './open-meteo-request';

/** A fetch that never answers, rejecting only when its signal aborts */
const silent: typeof fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () =>
      reject(new DOMException('Aborted', 'AbortError')),
    );
  });

const answering =
  (status: number, body: string): typeof fetch =>
  async () =>
    new Response(body, { status });

describe('fetchOpenMeteo', () => {
  it('gives the answer and its JSON', async () => {
    const { response, data } = await fetchOpenMeteo('u', {
      fetchFn: answering(200, '{"daily":{"time":[]}}'),
    });
    expect(response.status).toBe(200);
    expect(data).toEqual({ daily: { time: [] } });
  });

  it('says Open-Meteo is busy when it doesn’t answer in time', async () => {
    await expect(
      fetchOpenMeteo('u', { fetchFn: silent, ms: 10 }),
    ).rejects.toThrow(OPEN_METEO_BUSY_MESSAGE);
  });

  it('says it’s busy when it answers that it is', async () => {
    for (const status of [429, 502, 503, 504])
      await expect(
        fetchOpenMeteo('u', {
          fetchFn: answering(
            status,
            '{"reason":"The service is overloaded","error":true}',
          ),
        }),
      ).rejects.toThrow(OPEN_METEO_BUSY_MESSAGE);
  });

  it('stops when cancelled, without saying it’s busy', async () => {
    const cancel = new AbortController();
    const request = fetchOpenMeteo('u', {
      fetchFn: silent,
      signal: cancel.signal,
      ms: 1000,
    });
    cancel.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('leaves other errors to the caller, with their JSON', async () => {
    const { response, data } = await fetchOpenMeteo('u', {
      fetchFn: answering(
        400,
        '{"error":true,"reason":"is out of allowed range"}',
      ),
    });
    expect(response.status).toBe(400);
    expect(data).toMatchObject({ error: true });
  });

  it('gives null data for an answer that isn’t JSON', async () => {
    const { response, data } = await fetchOpenMeteo('u', {
      fetchFn: answering(500, '<html>error</html>'),
    });
    expect(response.ok).toBe(false);
    expect(data).toBeNull();
  });
});
