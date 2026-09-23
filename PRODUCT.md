# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Employees at small and growing software companies who need to apply for leave, view payslips, submit expense claims, and manage their profile without chasing HR through email or spreadsheets.

**Secondary:** HR admins and people ops who approve leave and claims, view payroll across the team, and keep routine HR work in one dashboard.

## Product Purpose

HR Pilot is a practice HR SaaS that gives a software team one login for everyday HR tasks—leaves, payroll, claims, and settings—so HR stops living in spreadsheets and employees stop waiting on manual processes.

Success means an employee can complete a routine task (apply for leave, check a payslip, submit a claim) in a couple of clicks, and an admin can approve or reject from the same system.

## Positioning

One simple platform built specifically for small software teams: a single dashboard with four core modules (Leaves, Payroll, Claims, Settings), seeded demo data, and intentionally lightweight auth—no third-party identity provider, no enterprise bloat.

## Operating Context

- Web app served at localhost in development; landing page, login, and protected dashboard.
- SQLite database with Prisma; demo reseedable via `npm run seed`.
- Two roles: `ADMIN` (approve/reject, view all payroll) and regular employees (own records only).
- Demo credentials documented in README and shown on the login page.

## Capabilities and Constraints

**Confirmed modules:**
- Leaves — apply, track balance, admin approval
- Payroll — employee payslips; admin view for all employees
- Claims — submit expenses, track approval; admin approve/reject
- Settings — profile and password

**Technical constraints:**
- Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui (Base UI)
- DB-backed session cookie auth (bcryptjs); no OAuth, email verification, or password reset
- Route protection via proxy + server-side session re-validation

**Terminology:** "HR Pilot", "workspace", "modules", "onboard" (people count on landing)

## Brand Commitments

- Product name: **HR Pilot** (logo mark: "HP" in primary-colored square)
- Tagline on landing: "HR, on autopilot."
- Voice: clear, practical, confident without enterprise jargon; speaks to modern software teams
- Self-described as "A practice HR SaaS project" in footer

## Evidence on Hand

- Seeded demo: 20 employees, admin account, sample leave/claim/payroll data (`prisma/seed.ts`)
- Landing stats (21 people onboard, 4 core modules, 100% cloud based access) — illustrative demo figures, not live metrics
- Do not fabricate customer logos, testimonials, case studies, or compliance certifications

## Product Principles

1. **Routine tasks in two clicks** — optimize for the everyday employee workflow, not HR configuration depth.
2. **One dashboard, four modules** — keep scope tight; avoid feature sprawl beyond leaves, payroll, claims, settings.
3. **Honest practice project** — demo credentials, reseedable data, no fake enterprise proof.
4. **Role clarity** — employees manage self; admins approve and oversee team records.
5. **Simple auth by design** — intentional tradeoff for a local/practice environment.
