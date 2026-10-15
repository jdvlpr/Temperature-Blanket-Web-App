-- Ravelry (src/lib/server/ravelry). The linked Ravelry account itself is a row
-- in "account" (providerId 'ravelry'); these tables hold what the app links to
-- it. Times are milliseconds since the epoch.

-- The Ravelry username, which Ravelry's API paths need, as last seen
create table "ravelryUser" (
  "userId" text not null primary key references "user" ("id") on delete cascade,
  "ravelryUserId" integer not null,
  "username" text not null,
  "updatedAt" integer not null
);

-- A saved project posted to Ravelry as a Ravelry project
create table "ravelryProject" (
  "userId" text not null references "user" ("id") on delete cascade,
  "projectId" text not null,
  "ravelryProjectId" integer not null,
  "ravelryUsername" text not null,
  "permalink" text not null,
  -- The Ravelry photo of the project's picture from this app, replaced on update
  "picturePhotoId" integer,
  "postedAt" integer not null,
  "updatedAt" integer not null,
  primary key ("userId", "projectId")
);

-- A linked project's Ravelry photos, kept so pages (the gallery's too) show
-- them without calling Ravelry with the owner's token
create table "ravelryPhoto" (
  "userId" text not null references "user" ("id") on delete cascade,
  "projectId" text not null,
  "photoId" integer not null,
  "sortOrder" integer not null default 0,
  -- 1 for the project's picture from this app
  "isPicture" integer not null default 0,
  "squareUrl" text,
  "smallUrl" text,
  "mediumUrl" text,
  "medium2Url" text,
  "aspectRatio" real,
  "addedAt" integer not null,
  primary key ("userId", "photoId")
);

create index "ravelryPhoto_userId_projectId_idx" on "ravelryPhoto" ("userId", "projectId", "sortOrder");
