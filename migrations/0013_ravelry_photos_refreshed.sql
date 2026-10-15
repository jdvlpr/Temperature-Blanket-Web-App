-- When a linked project's photos were last read from Ravelry, so My Projects
-- can refresh the oldest few in the background (photos added on Ravelry then
-- show on gallery pages too). Null: not since this migration.
alter table "ravelryProject" add column "photosRefreshedAt" integer;
