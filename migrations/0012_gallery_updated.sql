-- A gallery page is now updated in place (gallery plugin 1.9.0) instead of
-- published again as a new version: when it last was, or null if never.
-- Numbered after 0011 (Ravelry, on its own branch) so the two never clash.
alter table "galleryPost" add column "updatedAt" integer;
