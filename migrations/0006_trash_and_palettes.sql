-- The Trash and saved palettes (src/lib/server/sync).
--
-- Projects need no new columns for the Trash: a deleted project now keeps its R2
-- copy ("blobKey") for 30 days, so any device can see and restore it. Deletions
-- made before this migration have no copy and don't appear in the Trash.

-- One row per saved palette. Palettes are small, so they live here, not in R2.
-- Revisions share the "userSync" counter with projects, so one changes feed
-- carries both.
create table "palette" (
  "userId" text not null references "user" ("id") on delete cascade,
  "paletteId" text not null,
  "rev" integer not null,
  "name" text not null,
  -- The palette code (hex colors and yarn IDs); empty once purged
  "code" text not null,
  "createdAt" integer not null,
  -- When a device last changed it; the newest change wins
  "updatedAt" integer not null,
  -- In the Trash since then
  "deletedAt" integer,
  -- Deleted for good: a record only, so other devices remove it too. Nothing
  -- changes a purged palette again.
  "purgedAt" integer,
  primary key ("userId", "paletteId")
);

create index "palette_userId_rev_idx" on "palette" ("userId", "rev");
