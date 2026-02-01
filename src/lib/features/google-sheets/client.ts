// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import {
  PUBLIC_GOOGLE_API_KEY,
  PUBLIC_GOOGLE_CLIENT_ID,
} from '$env/static/public';
import { buildSpreadsheetData } from './formatter';
import type { ExportOptions } from './types';

const DISCOVERY_DOCS = [
  'https://sheets.googleapis.com/$discovery/rest?version=v4',
];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiLoaded = false;
let gisLoaded = false;
let tokenClient: google.accounts.oauth2.TokenClient | null = null;

/**
 * Loads the Google API script dynamically
 */
function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gapiLoaded = true;
      resolve();
    };
    script.onerror = () =>
      reject(new Error('Failed to load Google API script'));
    document.head.appendChild(script);
  });
}

/**
 * Loads the Google Identity Services script dynamically
 */
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = () =>
      reject(new Error('Failed to load Google Identity Services script'));
    document.head.appendChild(script);
  });
}

/**
 * Initializes the Google API client
 */
async function initializeGapiClient(): Promise<void> {
  await new Promise<void>((resolve) => {
    gapi.load('client', resolve);
  });

  await gapi.client.init({
    apiKey: PUBLIC_GOOGLE_API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
}

/**
 * Initializes the Google Identity Services token client
 */
function initializeGisClient(): Promise<void> {
  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: () => {
        // This will be overwritten per request
      },
    });
    resolve();
  });
}

/**
 * Requests an access token from Google
 */
function getAccessToken(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Token client not initialized'));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (tokenClient as any).callback = (response: any) => {
      if (response.error) {
        reject(new Error(response.error));
        return;
      }
      resolve();
    };

    if (gapi.client.getToken() === null) {
      // Prompt for consent
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      // Skip consent dialog for returning users
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

/**
 * Creates a new Google Sheet with the weather data
 */
async function createSpreadsheet(
  title: string,
  sheets: gapi.client.sheets.Sheet[],
): Promise<string> {
  const response = await gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: {
        title,
      },
      sheets,
    },
  });

  return response.result.spreadsheetId!;
}

/**
 * Applies batch updates to the spreadsheet (values, formatting, conditional formatting)
 */
async function applyBatchUpdate(
  spreadsheetId: string,
  requests: gapi.client.sheets.Request[],
): Promise<void> {
  await gapi.client.sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    resource: {
      requests,
    },
  });
}

/**
 * Updates values in the spreadsheet
 */
async function updateValues(
  spreadsheetId: string,
  data: gapi.client.sheets.ValueRange[],
): Promise<void> {
  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}

/**
 * Main export function - orchestrates the entire export process
 */
export async function exportToGoogleSheet(
  options: ExportOptions,
): Promise<string> {
  // Load scripts
  await Promise.all([loadGapiScript(), loadGisScript()]);

  // Initialize clients
  await initializeGapiClient();
  await initializeGisClient();

  // Get access token (will prompt user for authorization)
  await getAccessToken();

  // Build the spreadsheet data
  const { title, sheets, requests, values } = buildSpreadsheetData(options);

  // Create the spreadsheet
  const spreadsheetId = await createSpreadsheet(title, sheets);

  // Apply formatting and conditional formatting
  if (requests.length > 0) {
    await applyBatchUpdate(spreadsheetId, requests);
  }

  // Update cell values
  if (values.length > 0) {
    await updateValues(spreadsheetId, values);
  }

  // Return the URL to the new spreadsheet
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
}
