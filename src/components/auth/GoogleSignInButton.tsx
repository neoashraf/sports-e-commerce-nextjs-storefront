"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/api";
import { commitSession } from "@/lib/auth/session";
import { consumePendingAction } from "@/lib/auth/pending-action";
import { isApiError } from "@/lib/api/errors";
import { toast } from "@/lib/stores/toast";
import { useAuthUi } from "@/lib/stores/auth-ui";

/**
 * "Continue with Google" using Google Identity Services. Renders Google's official button; on success
 * the GIS callback hands us an ID-token `credential`, which we send to POST /auth/google → the backend
 * verifies it and returns our session (new email → sign up, known email → log in). Then we commit the
 * session, exactly like the phone flow, so it also resumes a gated action (e.g. checkout placement).
 *
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset or the GIS script can't load — the rest of
 * the auth options keep working. The id MUST match the backend's GOOGLE_CLIENT_ID.
 */
const GSI_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
}
interface GoogleIdApi {
  initialize(opts: { client_id: string; callback: (r: GoogleCredentialResponse) => void }): void;
  renderButton(parent: HTMLElement, opts: Record<string, unknown>): void;
}
declare global {
  // eslint-disable-next-line no-var
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

/** Resolve the GIS `id` API, loading the script once if needed; null if it can't load. */
function loadGsi(): Promise<GoogleIdApi | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(null);
    if (window.google?.accounts?.id) return resolve(window.google.accounts.id);
    const done = () => resolve(window.google?.accounts?.id ?? null);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", done, { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = done;
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export function GoogleSignInButton() {
  const closeAuth = useAuthUi((s) => s.closeAuth);
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(!CLIENT_ID);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;

    void loadGsi().then((api) => {
      if (cancelled) return;
      if (!api || !ref.current) {
        setHidden(true);
        return;
      }
      api.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => {
          void (async () => {
            try {
              const session = await auth.google(resp.credential);
              commitSession(session.customer, session.tokens);
              const name = session.customer.full_name;
              toast(session.is_new_account && name ? `Welcome, ${name}!` : "Logged in");
              closeAuth();
              consumePendingAction();
            } catch (err) {
              toast(
                isApiError(err)
                  ? "Google sign-in failed. Please try again."
                  : "Something went wrong. Please try again.",
                "error",
              );
            }
          })();
        },
      });
      api.renderButton(ref.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: 320,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [closeAuth]);

  if (hidden) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-body-sm text-text-faint">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        or
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
}
