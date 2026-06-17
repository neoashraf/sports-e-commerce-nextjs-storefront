import { render, screen } from "@testing-library/react";
import PrivacyPolicyPage, { metadata } from "./page";

describe("CMS — Privacy Policy static page", () => {
  it("renders the heading, draft notice, a section, and the Contact link", () => {
    render(<PrivacyPolicyPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent(/pending legal sign-off/i);
    expect(
      screen.getByRole("heading", { level: 2, name: /information we collect/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/pages/contact",
    );
  });

  it("includes a Bangla-tagged section scaffold", () => {
    render(<PrivacyPolicyPage />);
    const bn = screen.getByRole("heading", { name: "বাংলা সংস্করণ" });
    expect(bn).toHaveAttribute("lang", "bn");
  });

  it("exports SEO metadata", () => {
    expect(metadata.title).toBe("Privacy Policy");
    expect(typeof metadata.description).toBe("string");
  });
});
