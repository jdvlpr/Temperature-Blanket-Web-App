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
      type Sheet = any;
      type Request = any;
      type ValueRange = any;
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
    callback?: (response: any) => void;
  }

  interface TokenClient {
    requestAccessToken(options?: { prompt?: string }): void;
  }

  function initTokenClient(config: TokenClientConfig): TokenClient;
}
