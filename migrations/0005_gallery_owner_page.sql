-- A public page listing an owner's gallery pages, at /gallery/by/<publicId>.
-- The ID is random and separate from the account ID, so account IDs never
-- appear in public URLs, and it stays the same when the owner renames
-- themselves. Set the first time the owner chooses to show their name.
alter table "galleryOwner" add column "publicId" text;

create unique index "galleryOwner_publicId_idx" on "galleryOwner" ("publicId");

-- Owners who chose to show their name before this migration: 12 random
-- characters, the same shape the app makes (PUBLIC_ID_PATTERN)
update "galleryOwner" set "publicId" = lower(hex(randomblob(6)))
where "showName" = 1 and "publicId" is null;
