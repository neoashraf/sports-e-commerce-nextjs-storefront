import { z } from "zod";
import { env } from "@/lib/env";
import { ApiError, type ApiErrorDetail } from "@/lib/api/errors";
import { getAccessToken } from "@/lib/stores/auth";

/**
 * Thin fetch wrapper — the single place that knows the request shape
 * (fe-api-integration). Attaches the customer Bearer token when present,
 * parses the platform error envelope into a typed ApiError, and optionally
 * validates the response body against a Zod schema so the backend's shape is
 * treated as external input.
 *
 * The storefront is mostly public: browse/search/product endpoints work with
 * no token. The token, when set, is attached automatically; pass `public: true`
 * to force-skip it (e.g. the OTP request/verify endpoints).
 *
 * Never scatter raw fetch() across components — go through `api`.
 */

type Json = Record<string, unknown> | unknown[] | null;

interface RequestOptions<T> {
  /** Zod schema for the `data` field of the response envelope. */
  schema?: z.ZodType<T>;
  /** Query params appended to the URL. */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Skip attaching the auth token (for public /auth/* endpoints). */
  public?: boolean;
  signal?: AbortSignal;
  /** Internal: set once a request has already retried after a token refresh. */
  _retried?: boolean;
}

/**
 * Lazily-injected token-refresh hook. `lib/auth/session.ts` registers it at
 * import time to avoid a static client → session → client import cycle. When a
 * protected call returns 401, the client refreshes once and retries.
 */
type RefreshFn = () => Promise<string | null>;
let refreshTokens: RefreshFn | null = null;
export function setRefreshHandler(fn: RefreshFn) {
  refreshTokens = fn;
}

/** Platform success envelope: { data, meta? }. */
const envelopeSchema = z.object({
  data: z.unknown(),
  meta: z.unknown().optional(),
});

/** Platform error envelope: { error: { code, message, details } }. */
const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z
      .array(z.object({ field: z.string().optional(), message: z.string() }))
      .optional(),
    retry_after: z.number().optional(),
  }),
});

function buildUrl(
  path: string,
  params?: RequestOptions<unknown>["params"],
): string {
  const base = env.apiUrl.replace(/\/$/, "");
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  body: Json | undefined,
  opts: RequestOptions<T> = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!opts.public) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: opts.signal,
      cache: "no-store",
    });
  } catch (cause) {
    // Network failure / aborted / CORS — no HTTP status available.
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server.", []);
  }

  // 204 No Content — nothing to parse; return undefined as T.
  if (res.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    if (res.ok) return undefined as T;
    throw new ApiError(res.status, "BAD_RESPONSE", res.statusText || "Request failed.");
  }

  if (!res.ok) {
    // 401 on a protected call → refresh the token once and retry transparently.
    if (
      res.status === 401 &&
      !opts.public &&
      !opts._retried &&
      refreshTokens
    ) {
      const newToken = await refreshTokens();
      if (newToken) {
        return request<T>(method, path, body, { ...opts, _retried: true });
      }
    }

    const parsed = errorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      const { code, message, details, retry_after } = parsed.data.error;
      throw new ApiError(
        res.status,
        code,
        message,
        (details as ApiErrorDetail[]) ?? [],
        retry_after,
      );
    }
    throw new ApiError(res.status, "UNKNOWN", res.statusText || "Request failed.");
  }

  // Success — unwrap the { data } envelope and optionally validate.
  const env_ = envelopeSchema.safeParse(payload);
  const data = env_.success ? env_.data.data : payload;

  if (opts.schema) {
    const valid = opts.schema.safeParse(data);
    if (!valid.success) {
      // Contract drift — surface clearly rather than passing bad data downstream.
      throw new ApiError(
        res.status,
        "CONTRACT_MISMATCH",
        `Response did not match expected shape for ${method} ${path}.`,
      );
    }
    return valid.data;
  }

  return data as T;
}

/**
 * GET that preserves the envelope `meta` (pagination) alongside the validated
 * `data`. Used by paginated listings where the typed `get()` (which drops meta)
 * isn't enough. Returns `{ data, meta }`; `meta` is the raw envelope meta object.
 */
async function getWithMeta<T>(
  path: string,
  opts: RequestOptions<T> = {},
): Promise<{ data: T; meta: Record<string, unknown> | undefined }> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (!opts.public) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.params), {
      method: "GET",
      headers,
      signal: opts.signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Could not reach the server.", []);
  }

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    throw new ApiError(res.status, "BAD_RESPONSE", res.statusText || "Request failed.");
  }

  if (!res.ok) {
    const parsed = errorEnvelopeSchema.safeParse(payload);
    if (parsed.success) {
      const { code, message, details, retry_after } = parsed.data.error;
      throw new ApiError(res.status, code, message, (details as ApiErrorDetail[]) ?? [], retry_after);
    }
    throw new ApiError(res.status, "UNKNOWN", res.statusText || "Request failed.");
  }

  const env_ = envelopeSchema.safeParse(payload);
  const data = env_.success ? env_.data.data : payload;
  const meta = env_.success ? (env_.data.meta as Record<string, unknown> | undefined) : undefined;

  if (opts.schema) {
    const valid = opts.schema.safeParse(data);
    if (!valid.success) {
      throw new ApiError(
        res.status,
        "CONTRACT_MISMATCH",
        `Response did not match expected shape for GET ${path}.`,
      );
    }
    return { data: valid.data, meta };
  }
  return { data: data as T, meta };
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions<T>) =>
    request<T>("GET", path, undefined, opts),
  getWithMeta,
  post: <T>(path: string, body?: Json, opts?: RequestOptions<T>) =>
    request<T>("POST", path, body, opts),
  patch: <T>(path: string, body?: Json, opts?: RequestOptions<T>) =>
    request<T>("PATCH", path, body, opts),
  put: <T>(path: string, body?: Json, opts?: RequestOptions<T>) =>
    request<T>("PUT", path, body, opts),
  delete: <T>(path: string, body?: Json, opts?: RequestOptions<T>) =>
    request<T>("DELETE", path, body, opts),
};
