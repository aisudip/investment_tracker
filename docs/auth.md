# Auth Coding Standards

## Authentication Provider: Clerk

**This app uses [Clerk](https://clerk.com) for all authentication.** Do NOT implement custom auth, session management, or JWT handling.

- NEVER use NextAuth, Auth.js, Lucia, or any other auth library
- NEVER manage sessions, tokens, or cookies manually
- NEVER store passwords or credentials in the database

---

## Installation & Setup

Clerk is installed via `@clerk/nextjs`. The middleware and provider must be configured before any auth can work.

### Middleware (`src/middleware.ts`)

Protect routes by configuring Clerk's middleware. All routes are public by default unless explicitly protected.

```ts
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/investments(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) auth.protect();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
```

### Provider (`src/app/layout.tsx`)

Wrap the app in `<ClerkProvider>` at the root layout level.

```tsx
// src/app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

---

## Getting the Current User

### In Server Components and `/data` helpers

Use Clerk's `auth()` helper from `@clerk/nextjs/server`. Import it via the `@/lib/auth` alias.

```ts
// src/lib/auth.ts  ← re-export Clerk's auth helper here
export { auth } from "@clerk/nextjs/server";
```

```ts
// Usage in /data helpers
import { auth } from "@/lib/auth";

const { userId } = await auth();
if (!userId) throw new Error("Unauthorized");
```

**Always call `auth()` inside the helper itself** — never pass `userId` in as a parameter (see `data-fetching.md`).

### In Client Components

Use the `useUser` or `useAuth` hooks from `@clerk/nextjs`.

```tsx
"use client";
import { useUser } from "@clerk/nextjs";

export function UserGreeting() {
  const { user } = useUser();
  return <p>Hello, {user?.firstName}</p>;
}
```

---

## Sign In / Sign Up UI

Use Clerk's pre-built components. Do NOT build custom auth forms.

```tsx
import { SignIn, SignUp, UserButton } from "@clerk/nextjs";

// Dedicated sign-in page: src/app/sign-in/[[...sign-in]]/page.tsx
export default function SignInPage() {
  return <SignIn />;
}

// Dedicated sign-up page: src/app/sign-up/[[...sign-up]]/page.tsx
export default function SignUpPage() {
  return <SignUp />;
}

// User avatar / account button in nav
<UserButton />
```

---

## User ID in the Database

When storing user-owned data, save Clerk's `userId` string as the `userId` column. Do NOT create a separate users table unless additional profile data is needed.

```ts
// Schema example
userId: text("user_id").notNull(), // Clerk userId, e.g. "user_2abc..."
```

---

## Summary

| Concern | Approved approach |
|---|---|
| Auth provider | Clerk (`@clerk/nextjs`) |
| Route protection | `clerkMiddleware` in `src/middleware.ts` |
| Getting user (server) | `auth()` from `@/lib/auth` |
| Getting user (client) | `useUser()` or `useAuth()` from `@clerk/nextjs` |
| Sign in / sign up UI | `<SignIn />`, `<SignUp />`, `<UserButton />` |
| Custom auth forms | ❌ Forbidden |
| Other auth libraries | ❌ Forbidden |
| Manual session/token handling | ❌ Forbidden |
