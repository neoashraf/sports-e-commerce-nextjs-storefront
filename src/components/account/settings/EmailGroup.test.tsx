import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import type { ReactNode } from "react";

/**
 * AUTH hardening test-track (auth-hardening-test AC4/AC7, auth-email-change-fe
 * AC1/AC2/AC3): verify-before-attach — the account email never changes at
 * request time; conflict (409) and wrong-code (400) branches render distinctly.
 */

const requestEmailChange = vi.fn();
const confirmEmailChange = vi.fn();
vi.mock("@/lib/api", () => ({
  me: {
    requestEmailChange: (...a: unknown[]) => requestEmailChange(...a),
    confirmEmailChange: (...a: unknown[]) => confirmEmailChange(...a),
  },
  auth: { resendVerifyEmail: vi.fn(), refresh: vi.fn() },
}));

import { ApiError } from "@/lib/api/errors";
import { EmailGroup } from "./EmailGroup";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const profile = { id: "c1", email: "old@example.com", email_verified: true };

/** Text matcher tolerant of interpolation splitting the string across text nodes. */
const containing = (needle: string) => (_: string, el: Element | null) =>
  el?.tagName === "P" && (el.textContent ?? "").includes(needle);

async function startRequest(next = "new@example.com") {
  await userEvent.click(screen.getByRole("button", { name: /change/i }));
  // fireEvent.change: one controlled update (jsdom + the Sheet's focus management
  // makes per-keystroke typing flaky; the change handler is what's under test).
  fireEvent.change(screen.getByLabelText(/new email/i), { target: { value: next } });
  await userEvent.click(screen.getByRole("button", { name: /send code/i }));
}

describe("AUTH — EmailGroup (FR-AUTH-041/044, verify-before-attach)", () => {
  afterEach(() => vi.clearAllMocks());

  it("request shows the code step and the displayed account email is unchanged (AC1)", async () => {
    requestEmailChange.mockResolvedValue({ request_id: "ecr_1", sent_to: "n**@example.com", expires_in: 900 });
    wrap(<EmailGroup profile={profile} />);

    await startRequest();
    await waitFor(() => expect(requestEmailChange).toHaveBeenCalledWith("new@example.com"));

    expect(await screen.findByText(containing("n**@example.com"))).toBeInTheDocument();
    // Pending-only: the card still shows the OLD address.
    expect(screen.getByText("old@example.com")).toBeInTheDocument();
  });

  it("address owned by another account renders the 409 conflict distinctly (AC2)", async () => {
    requestEmailChange.mockRejectedValue(new ApiError(409, "EMAIL_IN_USE", "in use"));
    wrap(<EmailGroup profile={profile} />);

    await startRequest();

    expect(await screen.findByText(/already in use by another account/i)).toBeInTheDocument();
  });

  it("wrong code at confirm renders the 400 error and stays on the code step (AC2)", async () => {
    requestEmailChange.mockResolvedValue({ request_id: "ecr_1", sent_to: "n**@example.com", expires_in: 900 });
    confirmEmailChange.mockRejectedValue(new ApiError(400, "EMAIL_CHANGE_INVALID", "bad code"));
    wrap(<EmailGroup profile={profile} />);

    await startRequest();
    await screen.findByText(containing("n**@example.com"));

    const boxes = screen.getAllByRole("textbox");
    for (const [i, d] of "204815".split("").entries()) {
      fireEvent.change(boxes[i], { target: { value: d } });
    }
    await userEvent.click(screen.getByRole("button", { name: /^confirm$/i }));
    await waitFor(() => expect(confirmEmailChange).toHaveBeenCalledWith("ecr_1", "204815"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect code/i);
    // Still on the code step — the account was never touched (edge 16).
    expect(screen.getByText("old@example.com")).toBeInTheDocument();
  });
});
