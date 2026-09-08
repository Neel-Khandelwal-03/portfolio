import Link from "next/link";

import { Container } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/ui/icons";

export default function ProjectNotFound() {
  return (
    <div className="py-20 sm:py-28">
      <Container className="max-w-2xl text-center">
        <p className="font-mono text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
          404
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Project not found
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">
          This project may have been unpublished or renamed.
        </p>
        <Link
          href="/projects"
          className="mt-7 inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-fg transition-colors duration-150 hover:bg-accent-hover"
        >
          <ArrowLeftIcon width={14} height={14} />
          Browse all projects
        </Link>
      </Container>
    </div>
  );
}
