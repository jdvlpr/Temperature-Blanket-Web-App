-- Reporting and blocking on the gallery (App Store guideline 1.2), and the
-- site owner's moderation (src/lib/server/gallery/reports.ts, blocks.ts).
-- Times are milliseconds since the epoch.

-- A report of a gallery page, from anyone, signed in or not. Read by the site's
-- owner on /gallery/reports. Never the IP address (the per-IP limit is a hash in
-- "codeRequestLimit").
create table "galleryReport" (
  "id" text primary key not null,
  "createdAt" integer not null,
  -- The WordPress post ID: /gallery/[id] or /gallery/palette/[id]
  "postId" integer not null,
  "kind" text not null check ("kind" in ('project', 'palette')),
  "reason" text not null check ("reason" in ('words', 'photo', 'spam', 'other')),
  "message" text not null default '',
  -- Given by a guest for a reply; a signed-in reporter's comes from the account
  "email" text,
  -- Who reported it, when signed in: once per page
  "userId" text references "user" ("id") on delete set null,
  -- Who published the page, when it was published from an account, copied at
  -- report time so Stop Publishing works after the page is forgotten
  "publisherId" text references "user" ("id") on delete set null,
  -- The owner's triage: 'new' until the page is hidden or the report dismissed
  "status" text not null default 'new' check ("status" in ('new', 'hidden', 'dismissed'))
);

create index "galleryReport_status_createdAt_idx" on "galleryReport" ("status", "createdAt");
create index "galleryReport_postId_idx" on "galleryReport" ("postId");
create unique index "galleryReport_userId_postId_idx" on "galleryReport" ("userId", "postId")
  where "userId" is not null;

-- A person the user blocked: their pages are left out of the user's gallery,
-- globe and Popular. Never shown who it is: the row is labelled by the page it
-- was made from. "scope" keeps anonymous pages from being tied to a name: a
-- block made from an anonymous page hides only that person's pages that don't
-- show their name ('anonymous'), one made from a page showing their name, or
-- their gallery, only those that do ('named').
create table "galleryBlock" (
  "userId" text not null references "user" ("id") on delete cascade,
  "blockedUserId" text not null references "user" ("id") on delete cascade,
  "scope" text not null check ("scope" in ('named', 'anonymous')),
  -- The page they were blocked from, for the Blocked list and Unblock
  "viaPostId" integer not null,
  "viaKind" text not null check ("viaKind" in ('project', 'palette')),
  "viaTitle" text not null default '',
  "createdAt" integer not null,
  primary key ("userId", "blockedUserId", "scope")
);

-- A page the site's owner hid after a report. Also has "hiddenAt", so it's left
-- out everywhere; this keeps restoring its item from the Trash from bringing
-- it back.
alter table "galleryPost" add column "moderatedAt" integer;

-- The site's owner stopped this account publishing (Stop Publishing for This
-- Person): publishing and updating answer 403 PUBLISHING_STOPPED
alter table "galleryOwner" add column "bannedAt" integer;
-- When the account agreed to the Gallery terms (/terms), asked at its first publish
alter table "galleryOwner" add column "termsAcceptedAt" integer;
