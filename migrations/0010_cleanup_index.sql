-- Finds the user whose sync cleanup is longest overdue (cleanUpIdleUser in
-- src/lib/server/sync/store.ts), so the Trash and replaced copies of someone who
-- stopped syncing are still cleaned up.
create index "userSync_cleanedUpAt_idx" on "userSync" ("cleanedUpAt");
