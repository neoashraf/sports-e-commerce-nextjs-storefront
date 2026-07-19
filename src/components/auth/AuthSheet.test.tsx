import { render, screen, act } from "@testing-library/react";
import { vi } from "vitest";
import { useAuthUi } from "@/lib/stores/auth-ui";

// Control the pathname returned to AuthSheet's close-on-navigation effect.
let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: () => {},
    replace: () => {},
    prefetch: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// The view flows pull heavy client deps (React Query, API client); stub them —
// this test only exercises the overlay open/close behaviour.
vi.mock("@/components/auth/PhoneFlow", () => ({ PhoneFlow: () => null }));
vi.mock("@/components/auth/EmailLoginForm", () => ({ EmailLoginForm: () => null }));
vi.mock("@/components/auth/EmailRegisterForm", () => ({
  EmailRegisterForm: () => null,
}));
vi.mock("@/components/auth/ResetRequest", () => ({ ResetRequest: () => null }));

import { AuthSheet } from "./AuthSheet";

describe("AUTH — AuthSheet route handling", () => {
  afterEach(() => {
    useAuthUi.setState({ open: false });
    mockPathname = "/";
  });

  it("closes the overlay when the route changes (bug: stayed open over the page)", () => {
    const { rerender } = render(<AuthSheet />);
    act(() => useAuthUi.getState().openAuth());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Simulate clicking the Terms/Privacy link — client-side navigation.
    mockPathname = "/pages/terms-and-conditions";
    rerender(<AuthSheet />);

    expect(useAuthUi.getState().open).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("stays open when opened without a route change", () => {
    render(<AuthSheet />);
    act(() => useAuthUi.getState().openAuth());
    expect(useAuthUi.getState().open).toBe(true);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
