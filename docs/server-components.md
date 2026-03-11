# Server Components

## What is a Server Component?

By default, every component in `src/app/` is a **React Server Component (RSC)** unless it has a `"use client"` directive at the top. Server Components run only on the server — they can be `async`, call data helpers directly, and never run in the browser.

---

## Async Params & SearchParams (Next.js 15)

**This is a hard requirement.** In Next.js 15, `params` and `searchParams` are **Promises**. You MUST `await` them before accessing any property.

### ❌ Wrong — will throw a runtime error

```tsx
// params is a Promise — destructuring it directly does NOT work
export default async function InvestmentPage({ params }: { params: { id: string } }) {
  const { id } = params; // ❌ undefined — params is still a Promise here
}
```

### ✅ Correct — always await params

```tsx
export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ resolved before use
}
```

### ✅ Correct — searchParams too

```tsx
export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams; // ✅
}
```

---

## Type Signatures

Always type `params` and `searchParams` as `Promise<...>` in the component props.

| Prop | Type |
|---|---|
| `params` | `Promise<{ [key: string]: string }>` |
| `searchParams` | `Promise<{ [key: string]: string \| string[] \| undefined }>` |

### Example with both

```tsx
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  // Now safe to use id and tab
}
```

---

## General Server Component Rules

1. **Do NOT add `"use client"`** unless the component uses browser APIs, event handlers, or React hooks (`useState`, `useEffect`, etc.).
2. **Always mark the component `async`** if it awaits anything (params, data helpers, etc.).
3. **Never pass server-only values** (sessions, DB results) to Client Components as props that could expose sensitive data — pass only the serialisable subset needed by the UI.
4. **Fetch data inside the component** (or in a `/data` helper) — see `docs/data-fetching.md`.

---

## Summary

| Concern | Rule |
|---|---|
| `params` type | `Promise<{ ... }>` — always |
| `searchParams` type | `Promise<{ ... }>` — always |
| Accessing params | `await` before destructuring |
| Accessing searchParams | `await` before destructuring |
| Component signature | `async function` when awaiting anything |
| `"use client"` | Only when browser APIs or hooks are required |
