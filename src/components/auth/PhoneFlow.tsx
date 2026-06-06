"use client";

import { useState } from "react";
import { auth } from "@/lib/api";
import { commitSession } from "@/lib/auth/session";
import { consumePendingAction } from "@/lib/auth/pending-action";
import { toast } from "@/lib/stores/toast";
import { useAuthUi } from "@/lib/stores/auth-ui";
import { PhoneStep } from "@/components/auth/PhoneStep";
import { OtpStep } from "@/components/auth/OtpStep";
import type { SessionDto } from "@/lib/api/schemas/auth";

/**
 * Phone-OTP login/registration (phone-otp-login brief). Two steps: phone →
 * OTP (+ inline name sub-step for new numbers). On success: commit the session,
 * toast, resume the pending action, and close the sheet.
 */
export function PhoneFlow() {
  const closeAuth = useAuthUi((s) => s.closeAuth);
  const [sent, setSent] = useState<{
    phone: string;
    challengeId: string;
    resendAfter: number;
  } | null>(null);

  const onVerified = (session: SessionDto) => {
    commitSession(session.customer, session.tokens);
    const name = session.customer.full_name;
    toast(
      session.is_new_account && name
        ? `Welcome, ${name.length > 24 ? `${name.slice(0, 24)}…` : name}!`
        : "Logged in",
    );
    closeAuth();
    consumePendingAction();
  };

  if (!sent) {
    return <PhoneStep purpose="login" onSent={setSent} />;
  }

  return (
    <OtpStep<SessionDto>
      phone={sent.phone}
      challengeId={sent.challengeId}
      resendAfter={sent.resendAfter}
      purpose="login"
      collectName
      verify={({ challengeId, code, fullName }) =>
        auth.verifyOtp({ challenge_id: challengeId, code, full_name: fullName })
      }
      onVerified={onVerified}
      onEditNumber={() => setSent(null)}
    />
  );
}
