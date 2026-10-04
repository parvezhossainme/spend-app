import Link from "next/link";
import { Compass } from "lucide-react";
import { Brand } from "@/components/common/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Brand />
      <span className="grid size-16 place-items-center rounded-full border border-border bg-card text-muted-foreground">
        <Compass className="size-7" />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The page you’re looking for doesn’t exist or has moved.
        </p>
      </div>
      <Link
        href="/records"
        className="rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-[var(--accent-foreground)]"
      >
        Back to Records
      </Link>
    </div>
  );
}
