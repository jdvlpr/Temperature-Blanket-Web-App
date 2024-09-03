import { SECRET_GEONAMES_USERNAME } from '$env/static/private';
import { API_SERVICES } from '$lib/constants';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const { searchParams } = url;

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat) throw error(400, 'Missing or invalid latitude');
  if (!lng) throw error(400, 'Missing or invalid longitude');

  let fetchUrl = API_SERVICES.geonamesfindNearbyPlaceName.baseURL;
  fetchUrl += `?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
  fetchUrl += '&username=' + SECRET_GEONAMES_USERNAME;

  const response = await fetch(fetchUrl);

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
