import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

/**
 * AUTH hardening test-track (auth-hardening-test AC7, auth-finish-account-fe
 * AC3): the order-confirmation "finish your account" CTA (FR-AUTH-074) shows
 * only for authenticated passwordless sessions, hosts the set-password flow
 * (freshness fast path — no OTP), and is dismissible.
 */

vi.mock("@/lib/api/hooks/orders", () => ({
  useOrderDetail: () => ({ data: undefined, isLoading: true, isError: false }),
}));
// The flow itself is covered in PasswordGroup.test; stub it here.
vi.mock("@/components/account/settings/SetPasswordFlow", () => ({
  SetPasswordFlow: () => <div data-testid="set-password-flow" />,
}));

import { useAuthStore } from "@/lib/stores/auth";
import { ConfirmationView } from "./ConfirmationView";

const baseCustomer = { id: "c1", full_name: "Sabbir", phone: "+8801712345678", email: null };
const tokens = { accessToken: "a", refreshToken: "r" };

describe("AUTH — order-confirmation finish-account CTA (FR-AUTH-074)", () => {
  afterEach(() => {
    useAuthStore.getState().clear();
  });

  it("shows the CTA with the inline set-password flow for a passwordless session (AC3)", () => {
    useAuthStore.getState().setSession({ ...baseCustomer, has_password: false }, tokens);
    render(<ConfirmationView orderNo="SO-100001" />);

    expect(screen.getByText(/create a password to finish your account/i)).toBeInTheDocument();
    expect(screen.getByTestId("set-password-flow")).toBeInTheDocument();
    // Freshness-window copy: phone already verified — no second code.
    expect(screen.getByText(/already verified/i)).toBeInTheDocument();
  });

  it("hides the CTA once the account has a password", () => {
    useAuthStore.getState().setSession({ ...baseCustomer, has_password: true }, tokens);
    render(<ConfirmationView orderNo="SO-100001" />);
    expect(screen.queryByText(/create a password to finish your account/i)).not.toBeInTheDocument();
  });

  it("hides the CTA for guests (no session) — the tracking hint shows instead", () => {
    render(<ConfirmationView orderNo="SO-100001" />);
    expect(screen.queryByText(/create a password to finish your account/i)).not.toBeInTheDocument();
    expect(screen.getByText(/track anytime with your order number and phone/i)).toBeInTheDocument();
  });

  it("is dismissible (AC3 — dismiss hides it without touching the session)", async () => {
    useAuthStore.getState().setSession({ ...baseCustomer, has_password: false }, tokens);
    render(<ConfirmationView orderNo="SO-100001" />);

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));
    expect(screen.queryByText(/create a password to finish your account/i)).not.toBeInTheDocument();
  });
});
