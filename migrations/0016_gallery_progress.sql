-- A project's gallery page can show how far its blanket is made ("62% made"):
-- the owner's choice in Edit Gallery Page (Show my progress, off to start).
-- Only in the app, like "showOwner": WordPress never has it. The percent as it
-- was when the owner last saved the page; null when it isn't shown.
alter table "galleryPost" add column "made" integer;
