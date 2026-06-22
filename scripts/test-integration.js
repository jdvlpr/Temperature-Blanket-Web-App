import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Robustly find specific env vars for protocol detection
function getProtocol() {
  const envPath = path.join(rootDir, '.env');
  if (!fs.existsSync(envPath)) return 'http';

  const content = fs.readFileSync(envPath, 'utf8');
  const certMatch = content.match(
    /^PRIVATE_TAILSCALE_CRT_PATH\s*=\s*["']?(.+?)["']?\s*$/m,
  );
  const keyMatch = content.match(
    /^PRIVATE_TAILSCALE_KEY_PATH\s*=\s*["']?(.+?)["']?\s*$/m,
  );

  if (certMatch && keyMatch) {
    const certPath = certMatch[1];
    const keyPath = keyMatch[1];
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return 'https';
    }
  }
  return 'http';
}

const protocol = getProtocol();
const url = `${protocol}://localhost:5180`;

console.log(`Starting integration tests at ${url}`);

// Start the server - let Vite handle .env loading
const server = spawn('vite', ['dev', '--host', 'localhost', '--port', '5180'], {
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  console.log('\nCleaning up processes...');
  server.kill();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Wait for the server to be ready
async function waitForServer(url, timeout = 60000) {
  const start = Date.now();
  const agent = new https.Agent({ rejectUnauthorized: false });
  const lib = url.startsWith('https') ? https : http;

  while (Date.now() - start < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = lib.get(url, { agent, timeout: 2000 }, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status: ${res.statusCode}`));
        });
        req.on('error', reject);
      });
      console.log('\nServer is ready!');
      return true;
    } catch (e) {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

async function runTests() {
  try {
    await waitForServer(url);

    console.log('\nRunning vitest...');
    // Let Vitest handle .env loading, but pass the base URL and TLS bypass
    const vitest = spawn('vitest', ['run', 'tests/integration'], {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        TEST_BASE_URL: url,
        NODE_TLS_REJECT_UNAUTHORIZED: '0',
      },
    });

    vitest.on('exit', (code) => {
      cleanup();
      process.exit(code || 0);
    });
  } catch (err) {
    console.error(`\nTest failure: ${err.message}`);
    cleanup();
    process.exit(1);
  }
}

runTests();
