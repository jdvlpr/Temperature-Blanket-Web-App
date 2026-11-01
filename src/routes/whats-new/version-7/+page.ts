import { error } from '@sveltejs/kit';

// The version 7 post is about accounts: only in builds with them (PUBLIC_ACCOUNTS_ENABLED)
export const prerender = __ACCOUNTS_ENABLED__;

export function load() {
  if (!__ACCOUNTS_ENABLED__) error(404, 'Not found');
}
