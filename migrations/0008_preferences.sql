-- Preferences that follow the person between devices (src/lib/sync/preferences).
-- One row per user. "values" is JSON: each preference ever changed, with when,
-- so the newest change to each wins. Revisions share the "userSync" counter, so
-- the changes feed carries preferences with projects and palettes.
create table "userPreferences" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "rev" integer not null,
  "values" text not null
);
