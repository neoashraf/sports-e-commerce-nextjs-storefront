import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import type { ReactNode } from "react";

/**
 * AUTH hardening test-track (auth-hardening-test AC7, auth-finish-account-fe AC1/AC2):
 * the settings Password card gates on `has_password` — passwordless accounts get the
 * "finish your account" set-password flow (FR-AUTH-036), passworded accounts the
 * change form — and the retired claim view is gone from the codebase.
 */

const requestPasswordSet = vi.fn();
const setPassword = vi.fn();
vi.mock("@/lib/api", () => ({
  me: {
    requestPasswordSet: (...a: unknown[]) => requestPasswordSet(...a),
    setPassword: (...a: unknown[]) => setPassword(...a),
    changePassword: vi.fn(),
  },
}));

import { PasswordGroup } from "./PasswordGroup";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const passwordless = { id: "c1", phone: "+8801712345678", has_password: false };
const passworded = { id: "c1", phone: "+8801712345678", has_password: true };

describe("AUTH — PasswordGroup (FR-AUTH-036/037, set-password card gating)", () => {
  afterEach(() => vi.clearAllMocks());

  it("passwordless account sees the finish-your-account card, not change-password (AC1)", () => {
    wrap(<PasswordGroup profile={passwordless} />);
    expect(screen.getByText(/finish your account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set a password/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /change password/i })).not.toBeInTheDocument();
  });

  it("account with a password sees only change-password (AC1)", () => {
    wrap(<PasswordGroup profile={passworded} />);
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
    expect(screen.queryByText(/finish your account/i)).not.toBeInTheDocument();
  });

  it("freshness fast path: otp_required=false goes straight to the password step (AC3, FR-AUTH-037)", async () => {
    requestPasswordSet.mockResolvedValue({ otp_required: false, set_token: "pst_x", expires_in: 600 });
    wrap(<PasswordGroup profile={passwordless} />);

    await userEvent.click(screen.getByRole("button", { name: /set a password/i }));

    expect(await screen.findByText(/no code needed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
  });

  it("OTP path: otp_required=true shows the code entry step (AC2, FR-AUTH-036)", async () => {
    requestPasswordSet.mockResolvedValue({
      otp_required: true,
      challenge_id: "otp_1",
      expires_in: 300,
      resend_after: 60,
    });
    wrap(<PasswordGroup profile={passwordless} />);

    await userEvent.click(screen.getByRole("button", { name: /set a password/i }));

    expect(await screen.findByText(/enter the code we texted/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend/i })).toBeDisabled(); // cooldown running
  });
});

// Claim retirement (auth-retire-lightweight AC1) is proven at build time: the
// ClaimFlow module and the "claim" auth view no longer exist, so any import of
// them fails compilation — no runtime assertion is possible or needed.
