-- Yarn palettes shared to the gallery from accounts (WordPress plugin 1.5.0).
-- They're recorded beside gallery projects, so My Projects lists both and the
-- same remove and account-deletion paths cover both. For a palette, "projectId"
-- holds the saved palette's ID and "link" its Yarn Palette Creator link (there's
-- no /gallery/[id] page for palettes).
alter table "galleryPost" add column "kind" text not null default 'project';
alter table "galleryPost" add column "link" text;
