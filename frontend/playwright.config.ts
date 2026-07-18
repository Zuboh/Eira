import { defineConfig, devices } from '@playwright/test'

// Dedicated ports (8001/5174, distinct from the usual 8000/5173 dev servers)
// so e2e runs never collide with a manually-running dev session.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command:
        'sh -c "rm -f e2e.db && PYTHONPATH=. uv run fastapi dev --port 8001"',
      cwd: '../backend',
      url: 'http://localhost:8001/api/v1/reparti/',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { DATABASE_URL: 'sqlite:///./e2e.db' },
    },
    {
      command: 'npm run dev -- --port 5174 --strictPort',
      url: 'http://localhost:5174',
      reuseExistingServer: false,
      timeout: 30_000,
      env: { VITE_API_BASE_URL: 'http://localhost:8001/api/v1' },
    },
  ],
})
