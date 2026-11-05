-- Feedback sent from the beta (next.temperature-blanket.com) with its Send
-- Feedback dialog (src/lib/server/beta-feedback.ts), read by the site's owner
-- on /beta/feedback. Anyone may send it, signed in or not. Never the IP
-- address (its per-IP limit is a hash in "codeRequestLimit"), never the
-- page's query (project links hold the whole project). Times are milliseconds
-- since the epoch.
create table "betaFeedback" (
  "id" text primary key not null,
  "createdAt" integer not null,
  "kind" text not null check ("kind" in ('broken', 'confusing', 'idea', 'overall')),
  -- Would they be happy if this replaced the main site today? Optional
  "ready" text check ("ready" in ('yes', 'mostly', 'not-yet')),
  "message" text not null,
  -- Given to get a reply (guests); a signed-in sender's comes from the account
  "email" text,
  "userId" text references "user" ("id") on delete set null,
  -- The page's path, without its query
  "page" text not null,
  -- JSON: app version, browser, screen, language, recent errors (feedbackContext)
  "context" text not null,
  -- The owner's triage: 'new' until marked done on /beta/feedback
  "status" text not null default 'new' check ("status" in ('new', 'done'))
);

create index "betaFeedback_status_createdAt_idx" on "betaFeedback" ("status", "createdAt");
