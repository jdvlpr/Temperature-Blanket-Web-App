// A minimal D1 stand-in over node:sqlite with the app's migrations applied, for
// unit-testing SQL. Covers prepare/bind/first/run/all and batch.
import type { D1Database } from '@cloudflare/workers-types';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function createTestD1(): { d1: D1Database; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of readdirSync('migrations').sort())
    if (file.endsWith('.sql'))
      sqlite.exec(readFileSync(`migrations/${file}`, 'utf8'));

  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...args: unknown[]) => statement(sql, args),
    first: async () => sqlite.prepare(sql).get(...(params as never[])) ?? null,
    run: async () => {
      sqlite.prepare(sql).run(...(params as never[]));
      return { success: true };
    },
    all: async () => ({
      results: sqlite.prepare(sql).all(...(params as never[])),
    }),
  });

  const d1 = {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: { run: () => Promise<unknown> }[]) => {
      const results = [];
      for (const s of statements) results.push(await s.run());
      return results;
    },
  };
  return { d1: d1 as unknown as D1Database, sqlite };
}
