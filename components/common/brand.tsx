import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm",
        className,
      )}
    >
      <Coins className="size-[18px]" strokeWidth={2.4} />
    </span>
  );
}

export function Brand({
  className,
  showVersion,
  version,
}: {
  className?: string;
  showVersion?: boolean;
  version?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <div className="leading-none">
        <p className="text-[15px] font-semibold tracking-tight text-foreground">MyMoney</p>
        {showVersion ? (
          <p className="mt-0.5 text-xs text-muted-foreground">v{version ?? "1.0.0"}</p>
        ) : null}
      </div>
    </div>
  );
}
