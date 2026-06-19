import { render, screen } from "@testing-library/react";
import { ContactAside } from "./ContactAside";

describe("LEAD — ContactAside", () => {
  it("shows the SportsVault hotline and email as actionable links", () => {
    render(<ContactAside />);

    expect(
      screen.getByRole("link", { name: "+880 1403-750170" }),
    ).toHaveAttribute("href", "tel:+8801403750170");
    expect(
      screen.getByRole("link", { name: "sabbir.cytrax@gmail.com" }),
    ).toHaveAttribute("href", "mailto:sabbir.cytrax@gmail.com");
  });

  it("shows opening hours with the government-holiday note", () => {
    render(<ContactAside />);
    expect(screen.getByText(/opening hours/i)).toBeInTheDocument();
    expect(screen.getByText("9:00 AM – 6:00 PM")).toBeInTheDocument();
    expect(screen.getByText(/government holidays/i)).toBeInTheDocument();
  });

  it("does not render a Visit / store-address block (no physical store)", () => {
    render(<ContactAside />);
    expect(screen.queryByText(/visit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/address/i)).not.toBeInTheDocument();
  });
});
