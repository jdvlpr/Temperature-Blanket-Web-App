import { SECRET_GEONAMES_USERNAME } from '$env/static/private';
import { API_SERVICES } from '$lib/constants';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { text } = params;

  if (!text) throw error(400, 'Missing or invalid search text');

  let fetchURL = API_SERVICES.geonames.baseURL;
  fetchURL += '?q=' + encodeURIComponent(text);
  fetchURL += '&name_startsWith=' + encodeURIComponent(text);
  // fetchURL += '&isNameRequired=true';
  // fetchURL += '&orderby=relevance';
  // if ($windowLanguage) url += `&countryBias=${$windowLanguage}`;

  // See https://www.geonames.org/export/codes.html for feature classes
  fetchURL += '&featureClass=H'; // stream, lake, ...
  fetchURL += '&featureClass=L'; //parks,area, ...
  fetchURL += '&featureClass=P'; //city, village,...
  fetchURL += '&featureClass=S'; //spot, building, farm
  fetchURL += '&featureClass=T'; //T mountain,hill,rock,...

  fetchURL += '&maxRows=10';
  fetchURL += '&fuzzy=1';
  fetchURL += '&username=' + SECRET_GEONAMES_USERNAME;

  const response = await fetch(fetchURL);
  const data = await response.json();

  if (data?.status?.value) {
    // See exception codes from geonames (https://www.geonames.org/export/webservice-exception.html
    let code = 400;
    if (data.status.value === 10) code = 401; // Authentication error
    error(code, data.status.message);
  }

  if (!data || !data?.geonames) {
    error(404, 'no data found.');
  }

  return json(data);
};
