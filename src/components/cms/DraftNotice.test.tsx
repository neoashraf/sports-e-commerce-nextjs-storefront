import { render, screen } from "@testing-library/react";
import { DraftNotice } from "./DraftNotice";

describe("CMS — DraftNotice", () => {
  it("renders the draft / non-binding notice as a note", () => {
    render(<DraftNotice />);
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(/draft — pending legal sign-off/i);
    expect(note).toHaveTextContent(/not legally binding/i);
  });
});
