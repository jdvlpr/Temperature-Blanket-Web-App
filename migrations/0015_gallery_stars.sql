-- Gallery pages the user starred to find again (src/lib/server/gallery/stars.ts).
-- Private bookmarks: only the user sees them, and they never count as views or
-- feed the Popular sort. The pages themselves stay on WordPress; a star on a
-- page that's gone is dropped the next time My Library looks. Times are
-- milliseconds since the epoch.
create table "galleryStar" (
  "userId" text not null references "user" ("id") on delete cascade,
  -- The WordPress post ID: /gallery/[id] or /gallery/palette/[id]
  "postId" integer not null,
  "kind" text not null check ("kind" in ('project', 'palette')),
  "createdAt" integer not null,
  primary key ("userId", "postId")
);

-- My Library's Starred: one kind, newest starred first
create index "galleryStar_userId_kind_createdAt_idx" on "galleryStar" ("userId", "kind", "createdAt");
