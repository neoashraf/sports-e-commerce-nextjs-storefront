import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LeadForm } from "./LeadForm";

/**
 * LG3 — the public Get Help form completes: Turnstile token in the submit body, graceful
 * degrade with no site key, and claim-evidence upload → attachment_ids.
 */
const h = vi.hoisted(() => ({
  siteKey: "",
  submitMutateAsync: vi.fn(),
  uploadMutateAsync: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    get turnstileSiteKey() {
      return h.siteKey;
    },
    apiUrl: "http://localhost:4000/api/v1",
  },
}));

vi.mock("@/lib/api/hooks/leads", () => ({
  useSubmitLead: () => ({ mutateAsync: h.submitMutateAsync, isPending: false }),
  useUploadLeadAttachment: () => ({ mutateAsync: h.uploadMutateAsync, isPending: false }),
}));

vi.mock("@/lib/stores/auth", () => ({
  useAuthStore: (selector: (s: { customer: undefined }) => unknown) => selector({ customer: undefined }),
}));

// Auto-solve the Turnstile widget so the token reaches the form.
vi.mock("@/components/leads/TurnstileWidget", () => ({
  TurnstileWidget: ({ onToken }: { onToken: (t: string | null) => void }) => {
    React.useEffect(() => {
      onToken("tok-123");
    }, [onToken]);
    return <div data-testid="turnstile" />;
  },
}));

async function fillBaseFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Your name"), "Test User");
  await user.type(screen.getByPlaceholderText("Phone (+8801…)"), "+8801712345678");
  await user.type(screen.getByPlaceholderText("Tell us how we can help…"), "Please help me out.");
}

describe("LEAD — LeadForm (LG3)", () => {
  beforeEach(() => {
    h.siteKey = "";
    h.submitMutateAsync.mockReset().mockResolvedValue({ reference: "HLP-20001", status: "new", acknowledgement_sent: true });
    h.uploadMutateAsync.mockReset().mockResolvedValue({ attachment_id: "att_1" });
  });

  it("includes the solved captcha_token in the submit body when a site key is set", async () => {
    h.siteKey = "0xTESTKEY";
    const user = userEvent.setup();
    render(<LeadForm />);

    expect(screen.getByTestId("turnstile")).toBeInTheDocument();
    await fillBaseFields(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(h.submitMutateAsync).toHaveBeenCalled());
    expect(h.submitMutateAsync.mock.calls[0][0]).toMatchObject({ captcha_token: "tok-123" });
  });

  it("submits without a token (no widget) when no site key is configured", async () => {
    const user = userEvent.setup();
    render(<LeadForm />);

    expect(screen.queryByTestId("turnstile")).not.toBeInTheDocument();
    await fillBaseFields(user);
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(h.submitMutateAsync).toHaveBeenCalled());
    expect(h.submitMutateAsync.mock.calls[0][0].captcha_token).toBeUndefined();
  });

  it("uploads claim evidence and includes the returned attachment_ids", async () => {
    const user = userEvent.setup();
    const { container } = render(<LeadForm />);

    await user.selectOptions(screen.getAllByRole("combobox")[0], "claim_return");
    await user.type(screen.getByPlaceholderText("Order reference (e.g. SO-100245)"), "SO-100245");
    await fillBaseFields(user);

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["x"], "evidence.jpg", { type: "image/jpeg" });
    await user.upload(fileInput, file);

    await waitFor(() => expect(h.uploadMutateAsync).toHaveBeenCalledWith(file));
    // Wait for the upload to settle (the "Uploading…" label clears).
    await waitFor(() => expect(screen.queryByText("Uploading…")).not.toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(h.submitMutateAsync).toHaveBeenCalled());
    expect(h.submitMutateAsync.mock.calls[0][0]).toMatchObject({ attachment_ids: ["att_1"] });
  });
});
