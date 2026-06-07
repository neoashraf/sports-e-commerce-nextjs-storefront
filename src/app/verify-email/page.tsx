import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail } from "./_components/VerifyEmail";

export const metadata: Metadata = {
  title: "Verify email",
  robots: { index: false, follow: false },
};

/** Email-verification landing page (FR-AUTH-043), opened from the email link. */
export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm">
        <Suspense fallback={<p className="text-sm text-gray-500">Verifying…</p>}>
          <VerifyEmail />
        </Suspense>
      </div>
    </main>
  );
}
