import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, HelpCircle, Mail, Star, ThumbsUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_VERSION } from "@/lib/nav";

export const metadata = { title: "Settings" };

const SECTIONS = {
  pro: {
    title: "Pro Version",
    icon: Star,
    body: "MyMoney is fully featured in this build — accounts, budgets, multi-currency, analysis, exports and backups are all included. A hosted Pro tier would add cloud sync, live exchange rates and shared budgets.",
  },
  like: {
    title: "Like MyMoney",
    icon: ThumbsUp,
    body: "Enjoying MyMoney? Share it with someone who wants a calmer way to manage their money.",
  },
  help: {
    title: "Help",
    icon: HelpCircle,
    body: null,
  },
  feedback: {
    title: "Feedback",
    icon: Mail,
    body: "Found a bug or have an idea? Feedback helps shape what gets built next.",
  },
} as const;

type Section = keyof typeof SECTIONS;

export default async function SettingsSectionPage({ params }: PageProps<"/settings/[section]">) {
  const { section } = await params;
  if (!(section in SECTIONS)) notFound();

  const config = SECTIONS[section as Section];
  const Icon = config.icon;

  return (
    <>
      <PageHeader title={config.title} back />
      <div className="space-y-4 px-3 pt-4 sm:px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="size-4 text-[var(--accent)]" /> {config.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-3 text-sm text-muted-foreground">
            {config.body ? <p>{config.body}</p> : null}

            {section === "help" ? (
              <ul className="space-y-2.5">
                {[
                  "Add income, expenses or transfers with the + button on Records.",
                  "Switch months with the arrows; tap Today to jump back.",
                  "Search anything from the magnifier in the header.",
                  "Set budgets per category and track them on the Budgets tab.",
                  "Export CSV/PDF or back up your data from Settings.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-income" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {section === "feedback" ? (
              <p>
                This environment has no outbound mail configured, so feedback is captured locally. In a hosted build this
                page would open your mail client or a support form.
              </p>
            ) : null}

            {section === "like" ? (
              <p className="text-xs">
                MyMoney v{APP_VERSION}
              </p>
            ) : null}

            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <ArrowLeft className="size-4" /> Back to settings
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
