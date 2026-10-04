import * as React from "react";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function IconBadge({
  name,
  color,
  className,
  iconClassName,
}: {
  name: string | null | undefined;
  color: string;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = getIcon(name);
  return (
    <span
      className={cn("grid size-10 shrink-0 place-items-center rounded-full", className)}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {React.createElement(Icon, { className: cn("size-[18px]", iconClassName), strokeWidth: 2.1 })}
    </span>
  );
}
