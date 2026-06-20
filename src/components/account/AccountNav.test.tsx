import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/account",
}));

import { AccountNav } from "./AccountNav";

describe("LEAD — AccountNav", () => {
  it("links My enquiries into the account sub-nav", () => {
    render(<AccountNav />);
    // Rendered in both the desktop sidebar and the mobile tab strip.
    const links = screen.getAllByRole("link", { name: /my enquiries/i });
    expect(links.length).toBeGreaterThan(0);
    links.forEach((l) => expect(l).toHaveAttribute("href", "/account/enquiries"));
  });
});
