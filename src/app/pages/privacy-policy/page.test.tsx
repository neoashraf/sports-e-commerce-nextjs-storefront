import { render, screen } from "@testing-library/react";
import PrivacyPolicyPage, { metadata } from "./page";

describe("CMS — Privacy Policy static page", () => {
  it("renders the heading and key policy sections", () => {
    render(<PrivacyPolicyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /information we collect/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /data security/i }),
    ).toBeInTheDocument();
  });

  it("uses the SportsVault support contacts", () => {
    render(<PrivacyPolicyPage />);

    const emailLinks = screen.getAllByRole("link", {
      name: "sabbir.cytrax@gmail.com",
    });
    expect(emailLinks.length).toBeGreaterThan(0);
    emailLinks.forEach((l) =>
      expect(l).toHaveAttribute("href", "mailto:sabbir.cytrax@gmail.com"),
    );

    const phoneLinks = screen.getAllByRole("link", { name: /1403-750170/ });
    expect(phoneLinks.length).toBeGreaterThan(0);
    phoneLinks.forEach((l) =>
      expect(l).toHaveAttribute("href", "tel:+8801403750170"),
    );
  });

  it("links to the Contact page and includes a Bangla scaffold", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/pages/contact",
    );
    expect(
      screen.getByRole("heading", { name: "বাংলা সংস্করণ" }),
    ).toHaveAttribute("lang", "bn");
  });

  it("no longer shows the draft placeholder banner", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });

  it("exports SEO metadata", () => {
    expect(metadata.title).toBe("Privacy Policy");
    expect(typeof metadata.description).toBe("string");
  });
});
