import { Skeleton } from "@/components/ui/card";

function HeaderSkeleton({ brand = false }: { brand?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-3 sm:px-4 lg:px-6">
      <Skeleton className="size-10 rounded-full lg:hidden" />
      <div className="flex-1">
        <Skeleton className={brand ? "ml-auto h-5 w-24 lg:ml-0" : "h-5 w-32"} />
      </div>
      <Skeleton className="size-10 rounded-full" />
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="px-3 pt-4 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-3 pt-4 sm:px-4 lg:px-6">
      {[0, 1].map((group) => (
        <div key={group} className="space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <div className="rounded-[var(--radius-xl)] border border-border bg-card p-2">
            {Array.from({ length: rows / 2 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 px-3 pt-4 sm:grid-cols-2 sm:px-4 lg:px-6 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-xl)]" />
      ))}
    </div>
  );
}

export function ChartsSkeleton() {
  return (
    <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-20 w-full rounded-[var(--radius-xl)]" />
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-xl)]" />
      <Skeleton className="h-[240px] w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}

export function RecordsLoadingSkeleton() {
  return (
    <div>
      <HeaderSkeleton brand />
      <Skeleton className="mx-auto mt-3 h-8 w-48 rounded-full" />
      <SummarySkeleton />
      <ListSkeleton />
    </div>
  );
}

export function AnalysisLoadingSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <ChartsSkeleton />
    </div>
  );
}

export function CardsLoadingSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <SummarySkeleton />
      <CardsSkeleton />
    </div>
  );
}

export function SettingsLoadingSkeleton() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-40 w-full rounded-[var(--radius-xl)]" />
        ))}
      </div>
    </div>
  );
}
