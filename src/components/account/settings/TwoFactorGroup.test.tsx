import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import type { ReactNode } from "react";

/**
 * MFA hardening test-track (mfa-hardening-test AC6, mfa-settings-hardening-fe
 * AC1–AC4): the disable code step appears exactly when the backend demands it
 * (400 MFA_CODE_REQUIRED), 429 throttling renders as a cooldown message, the
 * enable picker pre-selects the policy default_channel, and success copy notes
 * other devices were signed out.
 */

const mfaGet = vi.fn();
const mfaEnable = vi.fn();
const mfaConfirm = vi.fn();
const mfaDisable = vi.fn();
vi.mock("@/lib/api", () => ({
  me: {
    mfa: {
      get: (...a: unknown[]) => mfaGet(...a),
      enable: (...a: unknown[]) => mfaEnable(...a),
      confirmEnable: (...a: unknown[]) => mfaConfirm(...a),
      disable: (...a: unknown[]) => mfaDisable(...a),
      setPreferredChannel: vi.fn(),
    },
  },
}));

const toast = vi.fn();
vi.mock("@/lib/stores/toast", () => ({ toast: (...a: unknown[]) => toast(...a) }));

import { ApiError } from "@/lib/api/errors";
import { TwoFactorGroup } from "./TwoFactorGroup";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const policy = (over: Partial<{ enabled: boolean; def: "email" | "sms" }> = {}) => ({
  enabled: over.enabled ?? false,
  preferred_channel: null,
  policy: {
    enforcement_mode: "optional",
    available_channels: ["email", "sms"],
    default_channel: over.def ?? "email",
  },
  eligible_channels: ["email", "sms"],
});

const typeCode = (code: string) => {
  const boxes = screen.getAllByRole("textbox");
  for (const [i, d] of code.split("").entries()) {
    fireEvent.change(boxes[i], { target: { value: d } });
  }
};

describe("MFA — TwoFactorGroup hardening (FR-MFA-002/008/018/036)", () => {
  afterEach(() => vi.clearAllMocks());

  it("enable picker pre-selects the policy default_channel (AC3, FR-MFA-036)", async () => {
    mfaGet.mockResolvedValue(policy({ def: "sms" }));
    wrap(<TwoFactorGroup />);

    expect(await screen.findByRole("radio", { name: /sms/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /email/i })).not.toBeChecked();
  });

  it("2FA-verified path: disable completes with password only + signed-out note (AC1/AC4)", async () => {
    mfaGet.mockResolvedValue(policy({ enabled: true }));
    mfaDisable.mockResolvedValue({ enabled: false });
    wrap(<TwoFactorGroup />);

    await userEvent.click(await screen.findByRole("button", { name: /turn off/i }));
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "footy2026" } });
    await userEvent.click(screen.getByRole("button", { name: /^turn off$/i }));

    await waitFor(() => expect(mfaDisable).toHaveBeenCalledWith("footy2026", undefined));
    expect(toast).toHaveBeenCalledWith(expect.stringMatching(/signed out/i));
  });

  it("non-verified path: 400 MFA_CODE_REQUIRED reveals the code step; the code completes the disable (AC1)", async () => {
    mfaGet.mockResolvedValue(policy({ enabled: true }));
    mfaDisable
      .mockRejectedValueOnce(new ApiError(400, "MFA_CODE_REQUIRED", "A verification code was sent to s****r@example.com."))
      .mockResolvedValueOnce({ enabled: false });
    wrap(<TwoFactorGroup />);

    await userEvent.click(await screen.findByRole("button", { name: /turn off/i }));
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "footy2026" } });
    await userEvent.click(screen.getByRole("button", { name: /^turn off$/i }));

    // Code step with the backend's masked-destination message.
    expect(await screen.findByText(/s\*\*\*\*r@example\.com/)).toBeInTheDocument();
    typeCode("482913");
    await userEvent.click(screen.getByRole("button", { name: /^turn off$/i }));

    await waitFor(() => expect(mfaDisable).toHaveBeenLastCalledWith("footy2026", "482913"));
  });

  it("wrong disable code renders distinctly and stays on the code step (AC2)", async () => {
    mfaGet.mockResolvedValue(policy({ enabled: true }));
    mfaDisable
      .mockRejectedValueOnce(new ApiError(400, "MFA_CODE_REQUIRED", "code sent"))
      .mockRejectedValueOnce(new ApiError(400, "INVALID_CODE", "wrong"));
    wrap(<TwoFactorGroup />);

    await userEvent.click(await screen.findByRole("button", { name: /turn off/i }));
    fireEvent.change(screen.getByLabelText(/current password/i), { target: { value: "footy2026" } });
    await userEvent.click(screen.getByRole("button", { name: /^turn off$/i }));
    await screen.findByText(/code sent/i);

    typeCode("000000");
    await userEvent.click(screen.getByRole("button", { name: /^turn off$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect code/i);
  });

  it("enrollment throttling (429) renders a cooldown message (AC2, FR-MFA-008)", async () => {
    mfaGet.mockResolvedValue(policy());
    mfaEnable.mockRejectedValue(new ApiError(429, "MFA_COOLDOWN", "wait", [], 42));
    wrap(<TwoFactorGroup />);

    await userEvent.click(await screen.findByRole("button", { name: /turn on/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/too many codes|try again/i);
  });
});
