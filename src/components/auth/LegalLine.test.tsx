import { render, screen } from "@testing-library/react";
import { LegalLine } from "./PhoneStep";

describe("AUTH — LegalLine", () => {
  it("links Terms and Privacy Policy to the CMS page slugs (regression: was /terms, /privacy)", () => {
    render(<LegalLine />);

    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/pages/terms-and-conditions",
    );
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
      "href",
      "/pages/privacy-policy",
    );
  });
});
