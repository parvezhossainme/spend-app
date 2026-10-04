"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { AlertTriangle, Check, Moon, Monitor, Save, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { CURRENCIES } from "@/lib/currency";
import { DATE_FORMATS, LANGUAGES, NUMBER_FORMATS, TIMEZONES, WEEK_DAYS } from "@/lib/constants";
import { PRESET_COLORS } from "@/lib/palette";
import { updatePreferencesAction } from "@/app/(dashboard)/settings/actions";
import { cn } from "@/lib/utils";

export type PreferencesFormValues = {
  defaultCurrency: string;
  theme: "dark" | "light" | "system";
  accentColor: string;
  dateFormat: string;
  numberFormat: string;
  timezone: string;
  firstDayOfWeek: number;
  language: string;
  notificationsEnabled: boolean;
  budgetWarningEnabled: boolean;
  monthlySummaryEnabled: boolean;
  largeTransactionEnabled: boolean;
  largeTransactionAmount: string;
};

export function PreferencesForm({ initial }: { initial: PreferencesFormValues }) {
  const toast = useToast();
  const { setTheme } = useTheme();
  const [form, setForm] = React.useState<PreferencesFormValues>(initial);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function update<K extends keyof PreferencesFormValues>(key: K, value: PreferencesFormValues[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function chooseTheme(theme: PreferencesFormValues["theme"]) {
    update("theme", theme);
    setTheme(theme);
  }

  function chooseAccent(color: string) {
    update("accentColor", color);
    document.documentElement.style.setProperty("--accent", color);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    const result = await updatePreferencesAction(form);
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    toast({ title: "Preferences saved", tone: "success" });
  }

  const themes: { value: PreferencesFormValues["theme"]; label: string; icon: typeof Sun }[] = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <form onSubmit={submit} className="space-y-4 pb-4">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="defaultCurrency">Default currency</Label>
              <Select
                id="defaultCurrency"
                value={form.defaultCurrency}
                onChange={(event) => update("defaultCurrency", event.target.value)}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.flag} {currency.code} — {currency.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select id="language" value={form.language} onChange={(event) => update("language", event.target.value)}>
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="firstDay">First day of week</Label>
              <Select
                id="firstDay"
                value={String(form.firstDayOfWeek)}
                onChange={(event) => update("firstDayOfWeek", Number(event.target.value))}
              >
                {WEEK_DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select id="timezone" value={form.timezone} onChange={(event) => update("timezone", event.target.value)}>
                {TIMEZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date format</Label>
              <Select id="dateFormat" value={form.dateFormat} onChange={(event) => update("dateFormat", event.target.value)}>
                {DATE_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="numberFormat">Number format</Label>
              <Select
                id="numberFormat"
                value={form.numberFormat}
                onChange={(event) => update("numberFormat", event.target.value)}
              >
                {NUMBER_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-3">
          <div>
            <Label>Theme</Label>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => chooseTheme(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-3 text-xs transition-colors",
                    form.theme === option.value
                      ? "border-[var(--accent)] bg-[var(--accent)]/12 text-[var(--accent)]"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <option.icon className="size-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Accent colour</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Accent ${color}`}
                  onClick={() => chooseAccent(color)}
                  className={cn(
                    "grid size-8 place-items-center rounded-full border transition-transform",
                    form.accentColor.toLowerCase() === color.toLowerCase()
                      ? "scale-110 border-foreground"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                >
                  {form.accentColor.toLowerCase() === color.toLowerCase() ? (
                    <Check className="size-4 text-[#1a1d1a]" strokeWidth={3} />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-3">
          <ToggleRow
            title="Enable notifications"
            description="Master switch for in-app alerts."
            checked={form.notificationsEnabled}
            onChange={(value) => update("notificationsEnabled", value)}
          />
          <ToggleRow
            title="Budget warning"
            description="Warn when a budget passes 75%."
            checked={form.budgetWarningEnabled}
            onChange={(value) => update("budgetWarningEnabled", value)}
            disabled={!form.notificationsEnabled}
          />
          <ToggleRow
            title="Monthly summary"
            description="A recap of the previous month."
            checked={form.monthlySummaryEnabled}
            onChange={(value) => update("monthlySummaryEnabled", value)}
            disabled={!form.notificationsEnabled}
          />
          <ToggleRow
            title="Large transaction warning"
            description="Flag unusually large transactions."
            checked={form.largeTransactionEnabled}
            onChange={(value) => update("largeTransactionEnabled", value)}
            disabled={!form.notificationsEnabled}
          />
          {form.largeTransactionEnabled ? (
            <div className="pt-2">
              <Label htmlFor="largeAmount">Large transaction threshold ({form.defaultCurrency})</Label>
              <Input
                id="largeAmount"
                inputMode="decimal"
                placeholder="e.g. 10000"
                value={form.largeTransactionAmount}
                onChange={(event) => update("largeTransactionAmount", event.target.value.replace(/[^\d.]/g, ""))}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {formError ? (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--expense)]/30 bg-[var(--expense)]/10 px-3 py-2 text-sm text-expense">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{formError}</span>
        </div>
      ) : null}

      <Button type="submit" size="lg" loading={saving} className="w-full">
        {!saving ? <Save className="size-4" /> : null}
        Save preferences
      </Button>
    </form>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={title} />
    </div>
  );
}
