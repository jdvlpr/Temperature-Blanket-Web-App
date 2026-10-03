import { error } from '@sveltejs/kit';

// The beta post exists only in builds with accounts (PUBLIC_ACCOUNTS_ENABLED)
export const prerender = __ACCOUNTS_ENABLED__;

export function load() {
  if (!__ACCOUNTS_ENABLED__) error(404, 'Not found');
}
