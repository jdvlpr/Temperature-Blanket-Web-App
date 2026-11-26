declare namespace gapi {
  function load(name: string, callback: () => void): void;
  namespace client {
    function init(options: {
      apiKey?: string;
      discoveryDocs?: string[];
      clientId?: string;
      scope?: string;
    }): Promise<void>;
    function getToken(): { access_token: string } | null;
    namespace sheets {
      // Google's JSON shapes, built where they're sent
      type Sheet = Record<string, unknown>;
      type Request = Record<string, unknown>;
      type ValueRange = Record<string, unknown>;
      namespace spreadsheets {
        function create(request: {
          resource: { properties: { title: string }; sheets: Sheet[] };
        }): Promise<{ result: { spreadsheetId: string } }>;
        function batchUpdate(request: {
          spreadsheetId: string;
          resource: { requests: Request[] };
        }): Promise<void>;
        namespace values {
          function batchUpdate(request: {
            spreadsheetId: string;
            resource: { valueInputOption: string; data: ValueRange[] };
          }): Promise<void>;
        }
      }
    }
  }
}

declare namespace google.accounts.oauth2 {
  interface TokenClientConfig {
    client_id: string;
    scope: string;
    callback?: (response: { access_token?: string; error?: string }) => void;
  }

  interface TokenClient {
    requestAccessToken(options?: { prompt?: string }): void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
}
