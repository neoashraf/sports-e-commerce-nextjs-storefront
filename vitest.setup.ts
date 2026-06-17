import "@testing-library/jest-dom/vitest";

// `@/lib/env` validates required public env vars at import time. Provide a
// harmless default so importing modules under test (e.g. the auth client chain
// pulled in via LegalLine) doesn't throw during the test run.
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:4000/api/v1";
