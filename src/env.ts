import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  PUBLIC_MICROSOFT_CLARITY_ID: { public: true, static: true },
  PUBLIC_BASE_URL: { public: true, static: true },
  PUBLIC_SITE_TITLE: { public: true, static: true },
  PUBLIC_YARN_SEARCH_REQUEST_FORM_LINK: { public: true, static: true },
  PUBLIC_KOFI_LINK: { public: true, static: true },
  PUBLIC_WORDPRESS_BASE_URL: { public: true, static: true },
  PUBLIC_BASE_DOMAIN_NAME: { public: true, static: true },
  PUBLIC_FACEBOOK_LINK: { public: true, static: true },
  PUBLIC_GITHUB_LINK: { public: true, static: true },
  SECRET_RAPID_API_PROXY_HEADER_KEY: { static: true },
  SECRET_METEOSTAT_API_KEY: { static: true },
  SECRET_METEOSTAT_DEV_API_KEY: { static: true },
  SECRET_WORDPRESS_PROJECT_CREATION_AUTH_KEY: { static: true },
  SECRET_GEONAMES_USERNAME: { static: true },
  PUBLIC_GOOGLE_API_KEY: { public: true, static: true },
  PUBLIC_GOOGLE_CLIENT_ID: { public: true, static: true },
  PUBLIC_AFFILIATE_BASE_URL: { public: true, static: true },
  PUBLIC_AFFILIATE_YARNS: { public: true, static: true },
  PUBLIC_SUPPORTERS: { public: true, static: true },
  PUBLIC_COOLORS_LINK: { public: true, static: true },
});
