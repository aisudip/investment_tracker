# Routing Coding Standards

## Route Structure

**All app routes must be nested under `/dashboard`.**

- The root route (`/`) redirects to `/dashboard`
- Every feature page (investments, banks, snapshots, etc.) lives under `/dashboard`
- NEVER create top-level feature routes (e.g., `/investments`, `/banks`) — they must be `/dashboard/investments`, `/dashboard/banks`, etc.

### Current Route Tree

```
/                              → redirect to /dashboard
/dashboard                     → Dashboard overview page
/dashboard/investments         → Investments list
/dashboard/investments/[id]/snapshots  → Snapshots for an investment
/dashboard/banks               → Banks list
/sign-in/[[...sign-in]]        → Clerk sign-in (public)
/sign-up/[[...sign-up]]        → Clerk sign-up (public)
```

---

## Route Protection

**All `/dashboard` routes are protected — only authenticated users may access them.**

Route protection is handled exclusively via **Next.js middleware** using Clerk. Do NOT add auth checks inside individual pages or layouts.

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- The matcher `/dashboard(.*)` covers the dashboard and all sub-routes
- Sign-in, sign-up, and static assets remain public
- See `docs/auth.md` for full Clerk setup details

---

## Root Page Redirect

The root page (`src/app/page.tsx`) must redirect unauthenticated users to `/sign-in` and authenticated users to `/dashboard`. Use Next.js `redirect()` — do NOT render UI on the root route.

```ts
// src/app/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");
  else redirect("/sign-in");
}
```

---

## Adding New Routes

When adding a new feature page:

1. Create it under `src/app/dashboard/<feature>/page.tsx`
2. No middleware changes are needed — `/dashboard(.*)` already protects all sub-routes
3. Add a nav link pointing to `/dashboard/<feature>`

---

## Summary

| Concern | Standard |
|---|---|
| Feature routes | Must be under `/dashboard/...` |
| Route protection | Clerk middleware in `src/middleware.ts` only |
| Auth checks in pages/layouts | ❌ Forbidden — middleware handles it |
| Top-level feature routes | ❌ Forbidden (e.g., `/investments` is wrong) |
| Root route (`/`) | Redirects to `/dashboard` or `/sign-in` |
