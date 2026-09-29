-- A public page listing an owner's gallery pages, at /gallery/by/<publicId>.
-- The ID is random and separate from the account ID, so account IDs never
-- appear in public URLs, and it stays the same when the owner renames
-- themselves. Set the first time the owner chooses to show their name.
alter table "galleryOwner" add column "publicId" text;

create unique index "galleryOwner_publicId_idx" on "galleryOwner" ("publicId");
