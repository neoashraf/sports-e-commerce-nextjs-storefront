import { render, screen } from "@testing-library/react";
import { AnnouncementBar } from "./Header";

describe("LEAD — header utility links", () => {
  it("links Get Help to the Contact page and Order Tracking to /track", () => {
    render(<AnnouncementBar />);
    expect(screen.getByRole("link", { name: /get help/i })).toHaveAttribute(
      "href",
      "/pages/contact",
    );
    expect(screen.getByRole("link", { name: /order tracking/i })).toHaveAttribute(
      "href",
      "/track",
    );
  });
});
