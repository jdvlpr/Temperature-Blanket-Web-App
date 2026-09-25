-- Project sync (src/lib/server/sync). Project data is gzipped JSON in R2; these
-- tables hold only metadata. Times are milliseconds since the epoch.

-- The per-user revision counter. Every write takes the next revision, so a device
-- can ask for everything changed after the last one it saw. Deletion records
-- older than 180 days are purged, which raises minValidRev: a device that last
-- synced before it must compare its whole list instead.
create table "userSync" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "rev" integer not null default 0,
  "minValidRev" integer not null default 0,
  "cleanedUpAt" integer not null default 0
);

-- One row per project. A deleted project keeps its row (deletedAt set, no blob)
-- so other devices learn about the deletion.
create table "project" (
  "userId" text not null references "user" ("id") on delete cascade,
  "projectId" text not null,
  "rev" integer not null,
  "deletedAt" integer,
  "clientUpdatedAt" integer not null,
  "serverUpdatedAt" integer not null,
  "schemaVersion" integer not null,
  "sizeBytes" integer not null,
  "title" text not null,
  -- SHA-256 of the uncompressed JSON, so devices can tell identical copies apart without downloading
  "contentHash" text,
  "blobKey" text,
  primary key ("userId", "projectId")
);

create index "project_userId_rev_idx" on "project" ("userId", "rev");

-- R2 objects replaced by a newer save or a deletion. Kept 7 days, so a copy lost
-- in a conflict can still be recovered, then deleted during the user's later syncs.
create table "syncOldBlob" (
  "key" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "replacedAt" integer not null
);

create index "syncOldBlob_userId_replacedAt_idx" on "syncOldBlob" ("userId", "replacedAt");
