-- Per-email limit on sign-in code requests (src/lib/server/auth/code-request-limit.ts).
-- Better Auth's own rate limit is per IP; this stops one inbox being flooded from many IPs.
-- The key is a SHA-256 hash of the email address, so no addresses are stored here.
create table "codeRequestLimit" ("key" text not null primary key, "windowStart" integer not null, "count" integer not null);
