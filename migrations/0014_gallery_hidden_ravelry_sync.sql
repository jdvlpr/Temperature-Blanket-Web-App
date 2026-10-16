-- A gallery page whose project or palette is in the Trash is hidden: moved to
-- WordPress's trash (gallery plugin 1.10.0 can bring it back) and left out of
-- the account's pages until the item is restored. Null: live.
alter table "galleryPost" add column "hiddenAt" integer;

-- What the app last read of a linked Ravelry project (src/lib/server/ravelry/sync.ts),
-- read only when someone looks: Ravelry's own updated_at, to fetch it again only
-- when it changed; its public notes without the link line, shown on the gallery
-- page; its yarns as JSON ([{ packId, colorway, name, yarnId, ours }], ours = added
-- by this app); and when it was last checked.
alter table "ravelryProject" add column "ravelryUpdatedAt" text;
alter table "ravelryProject" add column "notes" text;
alter table "ravelryProject" add column "packs" text;
alter table "ravelryProject" add column "checkedAt" integer;
-- A short hash of what the project's picture was drawn from, so Update sends a
-- new picture only when it changed
alter table "ravelryProject" add column "pictureKey" text;

-- When the user's Ravelry project list was last read, at most every few hours
alter table "ravelryUser" add column "listCheckedAt" integer;
