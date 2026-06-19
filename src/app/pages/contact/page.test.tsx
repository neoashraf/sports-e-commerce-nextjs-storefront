import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Stub the (client, React-Query-backed) LeadForm — capture the source it's
// rendered with so we can assert the wiring without a QueryClient provider.
let lastSource: string | undefined;
vi.mock("@/components/leads/LeadForm", () => ({
  LeadForm: ({ source }: { source?: string }) => {
    lastSource = source;
    return <div data-testid="lead-form" />;
  },
}));

import ContactPage, { metadata } from "./page";

describe("LEAD — Contact static page", () => {
  it("renders the header and hosts the Get Help form with source=contact_page", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Contact" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("lead-form")).toBeInTheDocument();
    expect(lastSource).toBe("contact_page");
  });

  it("renders the contact aside with the support contacts and no Visit block", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("link", { name: "+880 1700-000000" }),
    ).toHaveAttribute("href", "tel:+8801700000000");
    expect(
      screen.getByRole("link", { name: "info@sportsvault.com.bd" }),
    ).toHaveAttribute("href", "mailto:info@sportsvault.com.bd");
    expect(screen.queryByText(/visit/i)).not.toBeInTheDocument();
  });

  it("exports SEO metadata", () => {
    expect(metadata.title).toBe("Contact");
    expect(typeof metadata.description).toBe("string");
  });
});
