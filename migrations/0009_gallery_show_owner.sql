-- Whether a gallery page shows its owner is chosen for each page, not for the
-- whole account: "Include on my public gallery". When on, the page says "By"
-- and the owner's display name (as it is now) and is listed on their owner page.
alter table "galleryPost" add column "showOwner" integer not null default 0;

-- Pages of owners who showed their name before this migration keep showing it
update "galleryPost" set "showOwner" = 1
where "userId" in (select "userId" from "galleryOwner" where "showName" = 1);

-- The account-wide choice becomes the starting choice for the next page: the
-- last one the owner made
alter table "galleryOwner" rename column "showName" to "showOwnerDefault";
