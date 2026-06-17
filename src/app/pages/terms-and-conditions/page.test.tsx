import { render, screen } from "@testing-library/react";
import TermsAndConditionsPage, { metadata } from "./page";

describe("CMS — Terms & Conditions static page", () => {
  it("renders the heading, draft notice, a section, and the Contact link", () => {
    render(<TermsAndConditionsPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms & Conditions" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/pending legal sign-off/i);
    expect(
      screen.getByRole("heading", { level: 2, name: /payment/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/pages/contact",
    );
  });

  it("includes a Bangla-tagged section scaffold", () => {
    render(<TermsAndConditionsPage />);
    const bn = screen.getByRole("heading", { name: "বাংলা সংস্করণ" });
    expect(bn).toHaveAttribute("lang", "bn");
  });

  it("exports SEO metadata", () => {
    expect(metadata.title).toBe("Terms & Conditions");
    expect(typeof metadata.description).toBe("string");
  });
});
