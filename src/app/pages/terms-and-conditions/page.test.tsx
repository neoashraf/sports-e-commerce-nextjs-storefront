import { render, screen } from "@testing-library/react";
import TermsAndConditionsPage, { metadata } from "./page";

describe("CMS — Terms & Conditions static page", () => {
  it("renders the heading and key policy sections", () => {
    render(<TermsAndConditionsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Terms & Conditions" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /delivery/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /returns & exchange/i }),
    ).toBeInTheDocument();
  });

  it("uses the SportsVault support contacts", () => {
    render(<TermsAndConditionsPage />);

    const emailLinks = screen.getAllByRole("link", {
      name: "info@sportsvault.com.bd",
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    emailLinks.forEach((l) =>
      expect(l).toHaveAttribute("href", "mailto:info@sportsvault.com.bd"),
    );

    const phoneLinks = screen.getAllByRole("link", { name: /1700-000000/ });
    expect(phoneLinks.length).toBeGreaterThan(0);
    phoneLinks.forEach((l) =>
      expect(l).toHaveAttribute("href", "tel:+8801700000000"),
    );
  });

  it("links to the Contact page and includes a Bangla scaffold", () => {
    render(<TermsAndConditionsPage />);
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/pages/contact",
    );
    expect(
      screen.getByRole("heading", { name: "বাংলা সংস্করণ" }),
    ).toHaveAttribute("lang", "bn");
  });

  it("no longer shows the draft placeholder banner", () => {
    render(<TermsAndConditionsPage />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("exports SEO metadata", () => {
    expect(metadata.title).toBe("Terms & Conditions");
    expect(typeof metadata.description).toBe("string");
  });
});
