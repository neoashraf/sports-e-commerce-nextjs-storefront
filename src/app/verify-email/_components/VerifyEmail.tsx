"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/api";
import { isApiError } from "@/lib/api/errors";
import { patchCustomer } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

type Status = "verifying" | "success" | "expired" | "error";

export function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-invoke
    ran.current = true;
    if (!token) {
      setStatus("error");
      return;
    }
    auth
      .verifyEmail(token)
      .then(() => {
        patchCustomer({ email_verified: true });
        setStatus("success");
      })
      .catch((err) => {
        setStatus(isApiError(err) && err.status === 410 ? "expired" : "error");
      });
  }, [token]);

  if (status === "verifying") return <p className="text-sm text-gray-500">Verifying…</p>;

  if (status === "success") {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Email verified</h1>
        <p className="text-sm text-gray-600">Your email address has been confirmed.</p>
        <a href="/account"><Button>Go to my account</Button></a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">
        {status === "expired" ? "Link expired" : "Couldn't verify"}
      </h1>
      <p className="text-sm text-gray-600">
        {status === "expired"
          ? "This verification link has expired or was already used."
          : "We couldn't verify your email. Please try again from your account settings."}
      </p>
      <a href="/account/settings"><Button variant="secondary">Go to settings</Button></a>
    </div>
  );
}
