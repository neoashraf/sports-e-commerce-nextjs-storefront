import { render, screen } from "@testing-library/react";
import { StaticPageArticle } from "./StaticPageArticle";

describe("CMS — StaticPageArticle", () => {
  it("renders the title as the page H1", () => {
    render(<StaticPageArticle title="Privacy Policy">body</StaticPageArticle>);
    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy Policy" }),
    ).toBeInTheDocument();
  });

  it("renders JSX children when no bodyHtml is given", () => {
    render(
      <StaticPageArticle title="Terms">
        <p>Hello from a static page</p>
      </StaticPageArticle>,
    );
    expect(screen.getByText("Hello from a static page")).toBeInTheDocument();
  });

  it("injects sanitized bodyHtml when provided", () => {
    render(<StaticPageArticle title="From CMS" bodyHtml="<p>Managed body</p>" />);
    expect(screen.getByText("Managed body")).toBeInTheDocument();
  });

  it("shows the last-updated line only when updatedAt is supplied", () => {
    const { rerender } = render(<StaticPageArticle title="No date">x</StaticPageArticle>);
    expect(screen.queryByText(/last updated/i)).not.toBeInTheDocument();

    rerender(
      <StaticPageArticle title="With date" updatedAt="2026-06-01T00:00:00.000Z">
        x
      </StaticPageArticle>,
    );
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });
});
