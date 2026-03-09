# Data Fetching

## Golden Rule: Server Components Only

**ALL data fetching in this app MUST be done via React Server Components.**

This is a hard requirement. Do NOT fetch data via:
- Route handlers (`src/app/api/`)
- Client components (`"use client"`)
- `useEffect` / `fetch` on the client
- SWR, React Query, or any client-side fetching library
- Any other mechanism not listed below

The only approved pattern is: **Server Component → `/data` helper function → Drizzle ORM → Database**

---

## Data Helper Functions (`/data` directory)

All database queries must live in helper functions under `src/data/`. These are plain async functions called directly from Server Components.

### Rules for `/data` functions

1. **Use Drizzle ORM exclusively.** Do NOT write raw SQL strings.
2. **Always scope queries to the authenticated user.** Every query that returns user-owned data MUST filter by the current user's ID. A user must never be able to read or modify another user's data.
3. **Validate the session inside every helper.** Get the current user at the top of the function and throw (or return `null`) if there is no session.

### Example pattern

```ts
// src/data/investments.ts
import { db } from "@/lib/db";
import { investments } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function getInvestments() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return db
    .select()
    .from(investments)
    .where(eq(investments.userId, session.user.id));
}
```

### Calling a helper from a Server Component

```tsx
// src/app/dashboard/page.tsx
import { getInvestments } from "@/data/investments";

export default async function DashboardPage() {
  const investments = await getInvestments();
  return <InvestmentList investments={investments} />;
}
```

---

## Security: User Data Isolation

This is **critical**. Every `/data` helper that touches user-owned rows must:

1. Retrieve the authenticated session **inside the helper itself** — never trust a `userId` passed in from outside.
2. Include a `.where(eq(table.userId, session.user.id))` clause (or equivalent join condition) on every query.
3. Apply the same filter on mutations (update, delete) — never update/delete by ID alone.

**Never** accept a `userId` as a parameter to a data helper. Always derive it from the session.

---

## Summary

| Concern | Approved approach |
|---|---|
| Fetching data | Server Component calls a `/data` helper |
| Querying the DB | Drizzle ORM inside `/data` helpers |
| Raw SQL | ❌ Forbidden |
| Client-side fetching | ❌ Forbidden |
| Route handler fetching | ❌ Forbidden |
| User data isolation | Filter every query by `session.user.id` |
