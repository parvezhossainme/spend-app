"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { ICON_NAMES, getIcon } from "@/lib/icons";
import { PRESET_COLORS } from "@/lib/palette";
import { cn } from "@/lib/utils";

export function IconPicker({
  icon,
  color,
  onChange,
  compact = false,
}: {
  icon: string;
  color: string;
  onChange: (value: { icon?: string; color?: string }) => void;
  compact?: boolean;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const icons = showAll ? ICON_NAMES : ICON_NAMES.slice(0, 18);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Icon</p>
        <div className={cn("grid gap-1.5", compact ? "grid-cols-8" : "grid-cols-6")}>
          {icons.map((name) => {
            const Icon = getIcon(name);
            const active = name === icon;
            return (
              <button
                key={name}
                type="button"
                aria-label={name}
                onClick={() => onChange({ icon: name })}
                className={cn(
                  "grid aspect-square place-items-center rounded-[var(--radius-sm)] border transition-colors",
                  active ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        {ICON_NAMES.length > 18 ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:text-[var(--accent)] hover:underline"
          >
            {showAll ? "Show fewer icons" : `Show all ${ICON_NAMES.length} icons`}
          </button>
        ) : null}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Colour</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Colour ${preset}`}
              onClick={() => onChange({ color: preset })}
              className={cn(
                "grid size-8 place-items-center rounded-full border transition-transform",
                color.toLowerCase() === preset.toLowerCase() ? "border-foreground scale-110" : "border-transparent",
              )}
              style={{ backgroundColor: preset }}
            >
              {color.toLowerCase() === preset.toLowerCase() ? (
                <Check className="size-4 text-[#1a1d1a]" strokeWidth={3} />
              ) : null}
            </button>
          ))}
          <label className="relative grid size-8 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
            <input
              type="color"
              value={color}
              onChange={(event) => onChange({ color: event.target.value })}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom colour"
            />
            +
          </label>
        </div>
      </div>
    </div>
  );
}
