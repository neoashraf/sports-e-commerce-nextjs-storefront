"use client";

import { AuthSheet } from "@/components/auth/AuthSheet";
import { ToastViewport } from "@/components/ui/ToastViewport";
// Side-effect import: registers the 401 → token-refresh handler on the API client.
import "@/lib/auth/session";

/**
 * Global client chrome mounted once in the root layout: the auth overlay and
 * the toast viewport. Also pulls in the session module so the API client's
 * refresh interceptor is wired up before any request runs.
 */
export function AppChrome() {
  return (
    <>
      <AuthSheet />
      <ToastViewport />
    </>
  );
}
