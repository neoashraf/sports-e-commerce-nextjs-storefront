import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div>
        <h1 className="text-h1 font-bold text-ink">Page not found</h1>
        <p className="mt-1 text-body-sm text-text-muted">
          The page you’re looking for doesn’t exist or has moved.
        </p>
      </div>
      <Link
        href="/"
        className="inline-flex h-11 items-center rounded-md bg-volt px-5 text-body-sm font-semibold text-ink transition-colors duration-micro ease-out hover:bg-volt-600"
      >
        Back to home
      </Link>
    </div>
  );
}
