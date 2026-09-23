---
name: HR Pilot
description: Clean, confident HR SaaS UI for small software teams
colors:
  background: "oklch(1 0 0)"
  foreground: "oklch(0.145 0 0)"
  primary: "oklch(0.47 0.17 264)"
  primary-foreground: "oklch(0.985 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  accent: "oklch(0.94 0.03 264)"
  accent-foreground: "oklch(0.47 0.17 264)"
  destructive: "oklch(0.577 0.245 27.325)"
  border: "oklch(0.922 0 0)"
  card: "oklch(1 0 0)"
  sidebar: "oklch(0.19 0.03 264)"
typography:
  sans:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
  display:
    fontFamily: "{typography.sans.fontFamily}"
    fontWeight: 600
    letterSpacing: "-0.025em"
  body:
    fontFamily: "{typography.sans.fontFamily}"
    fontSize: "1rem"
    lineHeight: 1.5
rounded:
  sm: "calc(0.65rem * 0.6)"
  md: "calc(0.65rem * 0.8)"
  lg: "0.65rem"
  xl: "calc(0.65rem * 1.4)"
  2xl: "calc(0.65rem * 1.8)"
spacing:
  section-y: "6rem"
  container-x: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 1rem"
  card-feature:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
---

## Overview

HR Pilot uses a shadcn/ui + Tailwind system: white surfaces, indigo-violet primary (`oklch` hue ~264), Geist sans throughout, generous rounded corners, and subtle borders/shadows. Landing pages **Persuade**; dashboard surfaces **Operate** with a dark sidebar and light content area.

## Colors

- **Primary** carries CTAs, logo mark, icon accents, and hero emphasis words.
- **Muted** backgrounds (`muted/30`, `muted/60`) separate sections without heavy contrast.
- **Accent** tints hover states and pill badges; keep primary for decisive actions.
- **Sidebar** (dashboard): deep indigo-navy surface with lighter foreground text.
- Dark mode tokens exist in CSS; landing currently reads light-first.

## Typography

- **Geist Sans** for all UI and marketing copy; **Geist Mono** for code/data if needed.
- Headings: `font-semibold`, `tracking-tight`, scale from `text-lg` (brand) through `text-6xl` (hero).
- Body: `text-muted-foreground` for supporting copy; `text-balance` on hero paragraphs.
- No serif display; hierarchy is weight + size, not type pairing contrast.

## Layout

- **Max width:** `max-w-6xl` containers, centered, `px-4 md:px-6`.
- **Landing:** stacked hero (centered), stats band (3-col grid), features (4-col grid), CTA band, footer.
- **Dashboard:** sidebar + main content; cards and tables for data modules.
- Section rhythm: `py-24` / `py-32` on hero, `py-12`–`py-20` on supporting sections.

## Elevation & Depth

- Cards: `border`, `shadow-sm`, `hover:shadow-md` on feature tiles.
- Hero: radial gradient wash from `primary/10` at top—ambient, not dramatic.
- Avoid heavy drop shadows; depth comes from borders and subtle hover lift.

## Shapes

- Base radius `--radius: 0.65rem`; cards use `rounded-2xl`, icons in `rounded-xl` containers.
- Pills/badges: `rounded-full` with border + muted fill.
- Logo mark: `rounded-lg` (header) or `rounded-md` (footer) square with "HP" initials.

## Components

- **Buttons:** shadcn `buttonVariants` — primary default, secondary on inverted CTA section.
- **Feature cards:** icon in `bg-primary/10` tile, title + muted description, group hover inverts icon tile to primary fill.
- **Stat row:** icon + large number + muted label, horizontal flex.
- **Nav header:** border-b, logo + single "Log in" CTA with arrow icon.

## Do's and Don'ts

**Do**
- Use existing semantic tokens (`primary`, `muted-foreground`, `card`, `border`).
- Keep copy direct and task-oriented; one primary CTA per section.
- Use Lucide icons at consistent sizes (`h-4` inline, `h-5`/`h-6` in tiles).

**Don't**
- Introduce new hue families outside the indigo primary system without explicit redesign intent.
- Add fake social proof, customer logos, or compliance badges.
- Use decorative gradients or glass effects that fight the clean SaaS baseline.
