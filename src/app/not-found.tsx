import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="text-center">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          This page does not exist
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-fg-muted">
          The link may be out of date, or the project you are looking for has been unpublished.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex h-10 items-center rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
        >
          Back to the portfolio
        </Link>
      </div>
    </div>
  );
}
