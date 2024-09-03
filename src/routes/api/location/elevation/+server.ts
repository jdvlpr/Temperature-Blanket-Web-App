import { SECRET_GEONAMES_USERNAME } from '$env/static/private';
import { API_SERVICES, NO_DATA_SRTM3 } from '$lib/constants';
import { error, json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const { searchParams } = url;

  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat) error(400, 'Missing or invalid latitude');
  if (!lng) error(400, 'Missing or invalid longitude');

  let fetchUrl = API_SERVICES.geonamesGetAltitude.baseURL;
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

  if (!data) error(404, 'no data found.');

  // srtm3 is a single number giving the elevation in meters.
  if (data.srtm3 !== NO_DATA_SRTM3) return json(data.srtm3);

  return json(null);
};
