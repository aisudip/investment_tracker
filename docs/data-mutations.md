# Data Mutations

## Golden Rule: Server Actions Only

**ALL data mutations in this app MUST be done via Next.js Server Actions.**

This is a hard requirement. Do NOT mutate data via:
- Route handlers (`src/app/api/`)
- Client-side `fetch` / `axios` calls
- `useEffect` with a POST request
- Any other mechanism not listed below

The only approved pattern is: **Server Action (`actions.ts`) → `/data` helper function → Drizzle ORM → Database**

---

## `/data` Helper Functions

All database mutation logic must live in helper functions under `src/data/`. These are plain async functions called directly from Server Actions.

### Rules for `/data` mutation helpers

1. **Use Drizzle ORM exclusively.** Do NOT write raw SQL strings.
2. **Always scope mutations to the authenticated user.** Every insert, update, or delete that touches user-owned data MUST verify the current user's session and filter by their ID.
3. **Validate the session inside every helper.** Get the current user at the top of the function and throw if there is no session.
4. **Never accept `userId` as a parameter.** Always derive it from the session inside the helper itself.

### Example `/data` helpers

```ts
// src/data/investments.ts
import { db } from "@/lib/db";
import { investments } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function createInvestment(data: {
  name: string;
  amount: number;
  date: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  return db.insert(investments).values({ ...data, userId });
}

export async function deleteInvestment(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Always filter by userId to prevent cross-user mutation
  return db
    .delete(investments)
    .where(and(eq(investments.id, id), eq(investments.userId, userId)));
}
```

---

## Server Actions (`actions.ts`)

### Location and naming

Server Actions must live in colocated `actions.ts` files next to the page or component that uses them.

```
src/app/investments/
├── page.tsx
├── actions.ts   ← Server Actions for this route
```

### Rules for Server Actions

1. **Every file must start with `"use server"`.** This marks all exports as Server Actions.
2. **All parameters must be explicitly typed.** Do NOT use `FormData` as a parameter type — use plain typed objects instead.
3. **All arguments MUST be validated with Zod** before being passed to a `/data` helper.
4. **Call `/data` helpers for all DB work** — do not call Drizzle directly from an action.
5. **Return a typed result object** (e.g. `{ success: true }` or `{ error: string }`) so the client can respond appropriately.

### Example Server Action

```ts
// src/app/investments/actions.ts
"use server";

import { z } from "zod";
import { createInvestment, deleteInvestment } from "@/data/investments";

const createInvestmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().datetime(),
});

export async function createInvestmentAction(params: {
  name: string;
  amount: number;
  date: string;
}) {
  const parsed = createInvestmentSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await createInvestment(parsed.data);
  return { success: true };
}

const deleteInvestmentSchema = z.object({
  id: z.string().uuid(),
});

export async function deleteInvestmentAction(params: { id: string }) {
  const parsed = deleteInvestmentSchema.safeParse(params);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await deleteInvestment(parsed.data.id);
  return { success: true };
}
```

### Calling a Server Action from a Client Component

```tsx
// src/app/investments/DeleteButton.tsx
"use client";

import { deleteInvestmentAction } from "./actions";

export function DeleteButton({ id }: { id: string }) {
  async function handleClick() {
    const result = await deleteInvestmentAction({ id });
    if (result.error) console.error(result.error);
  }

  return <button onClick={handleClick}>Delete</button>;
}
```

---

## Security: User Data Isolation

**Critical.** Every `/data` mutation helper must:

1. Retrieve the authenticated session **inside the helper itself** — never trust a `userId` passed in from outside.
2. Apply a `.where(and(eq(table.id, id), eq(table.userId, userId)))` clause on all updates and deletes — never mutate by ID alone.

**Never** accept a `userId` as a parameter to a `/data` helper. Always derive it from the session.

---

## Summary

| Concern | Approved approach |
|---|---|
| Mutating data | Server Action calls a `/data` helper |
| DB writes | Drizzle ORM inside `/data` helpers |
| Server Action location | Colocated `actions.ts` next to the route |
| Server Action params | Explicitly typed — **never `FormData`** |
| Argument validation | Zod schema inside every Server Action |
| Raw SQL | ❌ Forbidden |
| Route handler mutations | ❌ Forbidden |
| Client-side fetch mutations | ❌ Forbidden |
| Calling Drizzle from an action directly | ❌ Forbidden |
| User data isolation | Filter every mutation by `session.userId` |
