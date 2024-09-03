import { SECRET_GEONAMES_USERNAME } from '$env/static/private';
import { API_SERVICES } from '$lib/constants';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { id } = params;

  if (!id) error(400, 'missing or invalid location id.');

  let fetchURL = API_SERVICES.geonamesGetID.baseURL;
  fetchURL += '?geonameId=' + encodeURIComponent(id);
  fetchURL += '&username=' + SECRET_GEONAMES_USERNAME;

  const response = await fetch(fetchURL);

  const data = await response.json();

  if (data?.status?.value) {
    // See exception codes from geonames (https://www.geonames.org/export/webservice-exception.html
    let code = 400;
    if (data.status.value === 10) code = 401; // Authentication error
    error(code, data.status.message);
  }

  if (!data) throw error(500, 'no data found.');

  return json(data);
};
