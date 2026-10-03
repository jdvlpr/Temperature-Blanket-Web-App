// A minimal D1 stand-in over node:sqlite with the app's migrations applied, for
// unit-testing SQL. Covers prepare/bind/first/run/all and batch. Like D1, foreign
// keys are enforced, a batch is one transaction, and run() reports meta.changes.
import type { D1Database } from '@cloudflare/workers-types';
import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function createTestD1(): { d1: D1Database; sqlite: DatabaseSync } {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const file of readdirSync('migrations').sort())
    if (file.endsWith('.sql'))
      sqlite.exec(readFileSync(`migrations/${file}`, 'utf8'));

  const statement = (sql: string, params: unknown[] = []) => ({
    bind: (...args: unknown[]) => statement(sql, args),
    first: async (column?: string) => {
      const row = sqlite.prepare(sql).get(...(params as never[])) ?? null;
      return column && row ? (row as Record<string, unknown>)[column] : row;
    },
    run: async () => {
      const { changes } = sqlite.prepare(sql).run(...(params as never[]));
      return { success: true, results: [], meta: { changes: Number(changes) } };
    },
    all: async () => ({
      success: true,
      results: sqlite.prepare(sql).all(...(params as never[])),
      meta: {},
    }),
  });

  const d1 = {
    prepare: (sql: string) => statement(sql),
    batch: async (statements: { run: () => Promise<unknown> }[]) => {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const s of statements) results.push(await s.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return { d1: d1 as unknown as D1Database, sqlite };
}
