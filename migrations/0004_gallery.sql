-- Gallery pages published from accounts (src/lib/server/gallery). The pages
-- themselves stay on WordPress, which stores the owner's user ID as private
-- post meta; these tables are the app's side of that link. Times are
-- milliseconds since the epoch.

-- One row per gallery page the user published while signed in. Kept apart from
-- "project" so it survives the project being edited, deleted or purged.
create table "galleryPost" (
  -- The WordPress post ID, which is also the /gallery/[id] page
  "postId" integer not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "projectId" text not null,
  "title" text not null,
  "publishedAt" integer not null
);

create index "galleryPost_userId_idx" on "galleryPost" ("userId");

-- Per-user gallery choices. No row means the defaults (0).
create table "galleryOwner" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  -- Show the account's display name on its gallery pages
  "showName" integer not null default 0,
  -- When the account is deleted: 1 removes its gallery pages, 0 keeps them
  -- without an owner
  "removeOnDelete" integer not null default 0
);
