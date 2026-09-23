import { Link } from "react-router";
import {
  CalendarDays,
  Wallet,
  Receipt,
  Settings,
  ArrowRight,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Leaves",
    description:
      "Apply for annual, sick, or unpaid leave in seconds. Track balances and approval status in real time.",
  },
  {
    icon: Wallet,
    title: "Payroll",
    description:
      "Employees can view monthly payslips with a full breakdown of salary, allowances, and deductions.",
  },
  {
    icon: Receipt,
    title: "Claims",
    description:
      "Submit expense claims for food, travel, medical and more - then track them through to approval.",
  },
  {
    icon: Settings,
    title: "Settings",
    description:
      "Manage your profile details and account security, all from one simple settings screen.",
  },
];

const HIGHLIGHTS = [
  "Built for small and growing software teams",
  "One login for every employee, one dashboard for HR",
  "Approvals handled in a couple of clicks",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              HP
            </div>
            <span className="text-lg font-semibold">HR Pilot</span>
          </div>
          <Link to="/login" className={cn(buttonVariants())}>
            Log in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"
            aria-hidden
          />
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center md:px-6 md:py-32">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for modern software teams
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              HR, on <span className="text-primary">autopilot</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground text-balance">
              One simple platform for your team&apos;s leaves, payroll, and expense claims - so HR
              stops living in spreadsheets and starts living in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/login" className={cn(buttonVariants({ size: "lg" }))}>
                Log in to your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {HIGHLIGHTS.map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-3 md:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-semibold">21</div>
                <div className="text-sm text-muted-foreground">People onboard</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-semibold">4</div>
                <div className="text-sm text-muted-foreground">Core HR modules</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-semibold">100%</div>
                <div className="text-sm text-muted-foreground">Cloud based access</div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-24 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="features-heading text-3xl font-semibold tracking-tight md:text-4xl">
              <span className="features-heading-part">Everything your team needs,</span>{" "}
              <span className="features-heading-part">in one dashboard</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From applying for leave to checking a payslip, HR Pilot keeps every routine HR task
              a couple of clicks away.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border-2 border-primary/35 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex h-12 w-12 scale-105 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to see it in action?
            </h2>
            <p className="max-w-xl text-primary-foreground/80">
              Log in with your employee account to apply for leave, submit a claim, or check your
              latest payslip.
            </p>
            <Link to="/login" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>
              Go to login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              HP
            </div>
            <span>HR Pilot &copy; {new Date().getFullYear()}</span>
          </div>
          <span>A practice HR SaaS project.</span>
        </div>
      </footer>
    </div>
  );
}
