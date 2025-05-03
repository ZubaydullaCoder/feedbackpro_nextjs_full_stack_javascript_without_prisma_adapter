Migrating to the latest version of NextAuth.js (now Auth.js, version 5) for a modern Next.js application using the App Router without TypeScript requires understanding the key changes from previous versions (e.g., v4) and aligning with current best practices. This comprehensive guide will walk you through the migration process, focusing on integrating Auth.js v5 into a Next.js App Router project, leveraging Server Components, Route Handlers, and secure authentication patterns. Since you’ve used an older version of NextAuth.js, I’ll highlight breaking changes, new conventions, and provide step-by-step instructions tailored to your JavaScript-based project.

---

## Comprehensive Migration Guide to Auth.js v5 with Next.js App Router (No TypeScript)

### Table of Contents

- [Comprehensive Migration Guide to Auth.js v5 with Next.js App Router (No TypeScript)](#comprehensive-migration-guide-to-authjs-v5-with-nextjs-app-router-no-typescript)
  - [Table of Contents](#table-of-contents)
  - [1. Overview of Auth.js v5 Changes](#1-overview-of-authjs-v5-changes)
  - [2. Prerequisites](#2-prerequisites)
  - [3. Step-by-Step Migration Guide](#3-step-by-step-migration-guide)
    - [Step 1: Upgrade Next.js and Install Auth.js v5](#step-1-upgrade-nextjs-and-install-authjs-v5)
    - [Step 2: Set Up the Auth.js Configuration](#step-2-set-up-the-authjs-configuration)
    - [Step 3: Create Route Handlers for Authentication](#step-3-create-route-handlers-for-authentication)
    - [Step 4: Implement Session Management](#step-4-implement-session-management)
    - [Step 5: Protect Routes with Middleware](#step-5-protect-routes-with-middleware)
    - [Step 6: Handle Client-Side Authentication](#step-6-handle-client-side-authentication)
    - [Step 7: Migrate from Older NextAuth.js Versions](#step-7-migrate-from-older-nextauthjs-versions)
    - [Step 8: Testing and Debugging](#step-8-testing-and-debugging)
  - [4. Best Practices for Auth.js v5 with Next.js App Router](#4-best-practices-for-authjs-v5-with-nextjs-app-router)
  - [5. Common Pitfalls and Troubleshooting](#5-common-pitfalls-and-troubleshooting)
  - [6. Additional Resources](#6-additional-resources)

---

### 1. Overview of Auth.js v5 Changes

Auth.js v5 (previously NextAuth.js) is a major rewrite with a focus on simplifying authentication, improving compatibility with Next.js App Router, and aligning with web standards. Key changes from v4 (and older versions) include:

- **Simplified Configuration**: The configuration is now centralized in a single file at the project root, exporting functions like `auth`, `signIn`, and `signOut`, reducing the need to pass `authOptions` around.
- **App Router Support**: Full support for Server Components, Route Handlers, and server-first architecture, leveraging standard Web APIs (`cookies`, `headers`).
- **Stricter OAuth Compliance**: Stricter adherence to OAuth/OIDC specifications, which may affect some providers. OAuth 1.0 is deprecated.
- **New `auth()` Function**: Replaces `getServerSession` and `getSession` for server-side session retrieval, optimized for performance with database-backed sessions.
- **Edge Compatibility**: Improved support for Edge runtime, with considerations for database/ORM compatibility.
- **Breaking Changes**:
  - Minimum Next.js version is 14.0.
  - Imports like `next-auth/next` and `next-auth/middleware` are replaced.
  - The old API route (`pages/api/auth/[...nextauth].js`) is simplified or replaced with Route Handlers.
  - Session and JWT callbacks have updated signatures.

Since you’re using the App Router and JavaScript, this guide will focus on idiomatic App Router patterns, avoiding TypeScript-specific instructions, and addressing migration from older versions (likely v3 or v4).

---

### 2. Prerequisites

Before starting, ensure you have:

- A Next.js project using the App Router (Next.js 14 or 15 recommended).
- Node.js version 16.14.0 or higher (Next.js 15 requires Node.js 18+).
- Familiarity with Next.js Server Components, Route Handlers, and Middleware.
- An existing NextAuth.js setup (v3 or v4) in a Pages Router or early App Router project.
- Environment variables set up for your authentication providers (e.g., Google, GitHub) and database (if used).
- A database (optional, for persistent sessions) like PostgreSQL with Prisma or MongoDB.

---

### 3. Step-by-Step Migration Guide

#### Step 1: Upgrade Next.js and Install Auth.js v5

1. **Upgrade Next.js**:
   Ensure your Next.js version is at least 14.0 (preferably 15 for latest features). Update your dependencies in `package.json`:

   ```json
   {
     "dependencies": {
       "next": "latest",
       "react": "latest",
       "react-dom": "latest"
     }
   }
   ```

   Run:

   ```bash
   npm install
   ```

2. **Install Auth.js v5**:
   Auth.js v5 is in beta, so install the beta tag. Remove the old `next-auth` package if present.

   ```bash
   npm uninstall next-auth
   npm install @auth/core@beta
   ```

   If using a database adapter (e.g., Prisma), install the appropriate adapter:

   ```bash
   npm install @auth/prisma-adapter
   ```

3. **Update Environment Variables**:
   Ensure your `.env` file includes necessary variables. Example:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   DATABASE_URL=your-database-url
   ```
   Generate a `NEXTAUTH_SECRET` using:
   ```bash
   openssl rand -base64 32
   ```

#### Step 2: Set Up the Auth.js Configuration

In Auth.js v5, the configuration is centralized in a single file at the project root, typically `auth.js`. This replaces the old `pages/api/auth/[...nextauth].js`.

1. **Create `auth.js`**:
   At the root of your project, create `auth.js`:

   ```javascript
   import { PrismaAdapter } from "@auth/prisma-adapter";
   import GoogleProvider from "@auth/core/providers/google";
   import { prisma } from "./lib/prisma"; // Your Prisma client

   export const authConfig = {
     adapter: PrismaAdapter(prisma), // Optional, for database sessions
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
       }),
     ],
     secret: process.env.NEXTAUTH_SECRET,
     callbacks: {
       async session({ session, user }) {
         session.user.id = user.id; // Add user ID to session
         return session;
       },
     },
     pages: {
       signIn: "/auth/signin", // Custom sign-in page
     },
   };

   export const { handlers, auth, signIn, signOut } = Auth(authConfig);
   ```

   - **Providers**: Configure your authentication providers (e.g., Google, Credentials). See [Auth.js Providers](https://authjs.dev/reference/core/providers/) for details.
   - **Adapter**: Use an adapter (e.g., PrismaAdapter) for database-backed sessions. Omit if using JWT sessions.
   - **Callbacks**: Customize session data, e.g., adding `user.id`.
   - **Exported Functions**: `handlers`, `auth`, `signIn`, and `signOut` are used throughout the app.

2. **Set Up Prisma (Optional)**:
   If using a database, ensure your Prisma schema includes the Auth.js models. Example `schema.prisma`:

   ```prisma
   model User {
     id            String    @id @default(uuid())
     name          String?
     email         String?   @unique
     emailVerified DateTime?
     image         String?
     accounts      Account[]
     sessions      Session[]
   }

   model Account {
     id                String  @id @default(uuid())
     userId            String
     type              String
     provider          String
     providerAccountId String
     refresh_token     String?
     access_token      String?
     expires_at        Int?
     token_type        String?
     scope             String?
     id_token          String?
     session_state     String?
     user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
     @@unique([provider, providerAccountId])
   }

   model Session {
     id           String   @id @default(uuid())
     sessionToken String   @unique
     userId       String
     expires      DateTime
     user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
   }

   model VerificationToken {
     identifier String
     token      String   @unique
     expires    DateTime
     @@unique([identifier, token])
   }
   ```

   Run `npx prisma migrate dev` to apply the schema.

#### Step 3: Create Route Handlers for Authentication

Auth.js v5 uses Route Handlers in the App Router instead of the old API route.

1. **Create Route Handler**:
   In `app/api/auth/[...auth]/route.js`, set up the dynamic route:

   ```javascript
   import { handlers } from "../../../../auth";

   export const { GET, POST } = handlers;
   ```

   This handles all authentication routes (e.g., `/api/auth/signin`, `/api/auth/callback/google`).

2. **Verify Route**:
   Test the sign-in route by visiting `http://localhost:3000/api/auth/signin`. It should display the default Auth.js sign-in page or redirect to your provider.

#### Step 4: Implement Session Management

Auth.js v5 simplifies session management with the `auth()` function for server-side checks and `useSession` for client-side.

1. **Server-Side Session Check (Server Component)**:
   In a Server Component, e.g., `app/dashboard/page.js`:

   ```javascript
   import { auth } from "../../auth";
   import { redirect } from "next/navigation";

   export default async function DashboardPage() {
     const session = await auth();
     if (!session) {
       redirect("/auth/signin");
     }
     return (
       <div>
         <h1>Welcome, {session.user.name}</h1>
       </div>
     );
   }
   ```

   - `auth()` retrieves the session securely on the server.
   - Redirect unauthenticated users to a custom sign-in page.

2. **Custom Sign-In Page**:
   Create `app/auth/signin/page.js` for a custom sign-in UI:

   ```javascript
   import { signIn } from "../../../auth";

   export default function SignInPage() {
     async function handleSignIn(formData) {
       "use server";
       await signIn("google", { redirectTo: "/dashboard" });
     }

     return (
       <form action={handleSignIn}>
         <button type="submit">Sign in with Google</button>
       </form>
     );
   }
   ```

   - Uses Server Actions for secure form submissions.
   - Redirects to `/dashboard` after successful sign-in.

#### Step 5: Protect Routes with Middleware

Use Next.js Middleware to protect routes or perform optimistic authorization checks.

1. **Create Middleware**:
   In `middleware.js` at the project root:

   ```javascript
   import { auth } from "./auth";
   import { NextResponse } from "next/server";

   export default auth(async function middleware(req) {
     const session = await auth();
     const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard");

     if (isProtectedRoute && !session) {
       return NextResponse.redirect(new URL("/auth/signin", req.url));
     }
     return NextResponse.next();
   });

   export const config = {
     matcher: ["/dashboard/:path*"],
   };
   ```

   - Protects `/dashboard` and its subroutes.
   - Redirects unauthenticated users to `/auth/signin`.

2. **Edge Runtime Consideration**:
   If using Edge runtime, ensure your database/ORM (e.g., Prisma) supports it. Alternatively, use JWT sessions or a compatible ORM.

#### Step 6: Handle Client-Side Authentication

For client-side components, use the `SessionProvider` and `useSession` hook.

1. **Wrap App with SessionProvider**:
   In `app/layout.js`, wrap your app with `SessionProvider`. Since it’s a Client Component, mark it with `"use client"`:

   ```javascript
   "use client";
   import { SessionProvider } from "@auth/core/react";

   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <SessionProvider>{children}</SessionProvider>
         </body>
       </html>
     );
   }
   ```

   - **Note**: `SessionProvider` cannot be in a Server Component, so place it in a Client Component or a separate layout.

2. **Use `useSession` in Client Components**:
   Example in `app/profile/page.js`:

   ```javascript
   "use client";
   import { useSession, signOut } from "@auth/core/react";

   export default function ProfilePage() {
     const { data: session } = useSession();

     if (!session) {
       return <p>Please sign in</p>;
     }

     return (
       <div>
         <p>Logged in as {session.user.name}</p>
         <button onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
           Sign out
         </button>
       </div>
     );
   }
   ```

#### Step 7: Migrate from Older NextAuth.js Versions

Since you’ve used an older version (likely v3 or v4), here’s how to migrate:

1. **From v3 to v4 (if applicable)**:

   - **Adapters**: Replace legacy adapters (e.g., `prisma-legacy`) with new ones (e.g., `@next-auth/prisma-adapter`).
   - **Imports**: Update imports:
     - `import jwt from "next-auth/jwt"` → `import { getToken } from "next-auth/jwt"`
     - `import { useSession } from "next-auth/client"` → `import { useSession } from "next-auth/react"`
   - **Database Schema**: If using a database, migrate the schema to v4’s model (similar to the Prisma schema above). See [v4 Migration Guide](https://next-auth.js.org/getting-started/upgrade-v4) for details.
   - **Callbacks**: Update callback signatures to named parameters:
     ```javascript
     // v3
     async jwt(token, user, account) { ... }
     // v4
     async jwt({ token, user, account }) { ... }
     ```

2. **From v4 to v5**:

   - **Remove Old API Route**: Delete `pages/api/auth/[...nextauth].js` and replace with `app/api/auth/[...auth]/route.js` (Step 3).
   - **Centralize Configuration**: Move `authOptions` to `auth.js` (Step 2).
   - **Update Session Retrieval**:

     - Replace `getServerSession` with `auth()` in Server Components and Route Handlers.
     - Example (v4):

       ```javascript
       import { getServerSession } from "next-auth/next";
       import { authOptions } from "../api/auth/[...nextauth]";

       export default async function handler(req, res) {
         const session = await getServerSession(req, res, authOptions);
         res.json({ session });
       }
       ```

       Example (v5):

       ```javascript
       import { auth } from "../../../auth";

       export async function GET(req) {
         const session = await auth();
         return Response.json({ session });
       }
       ```

   - **OAuth Providers**: Check for breaking changes due to stricter OAuth compliance. Test each provider (e.g., Google) and update configurations if needed. See [Auth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5).
   - **Middleware**: Replace `next-auth/middleware` with the new `auth` middleware approach (Step 5).

3. **Database Migration**:
   If using a database, ensure the schema matches Auth.js v5 requirements (see Prisma schema in Step 2). Run migrations to update tables like `User`, `Account`, `Session`, and `VerificationToken`.

#### Step 8: Testing and Debugging

1. **Test Authentication Flow**:

   - Sign in with each provider (e.g., Google).
   - Verify session data in Server Components and client-side components.
   - Test protected routes via Middleware.
   - Check sign-out and session expiration.

2. **Debug Common Issues**:

   - **Session Not Found**: Ensure `NEXTAUTH_SECRET` is set and matches across environments.
   - **Provider Errors**: Verify client ID/secret and callback URLs in your provider’s dashboard.
   - **Middleware Issues**: Check `matcher` config and ensure Edge compatibility.

3. **Logging**:
   Enable debug mode in `auth.js`:
   ```javascript
   export const authConfig = {
     // ...other config
     debug: process.env.NODE_ENV === "development",
   };
   ```

---

### 4. Best Practices for Auth.js v5 with Next.js App Router

- **Use Server Components for Auth Checks**: Perform session checks in Server Components to reduce client-side JavaScript and improve security.[](https://dev.to/shieldstring/nextjs-15-authentication-1al7)
- **Leverage Server Actions**: Use Server Actions for login/logout forms to keep sensitive logic on the server.[](https://nextjs.org/docs/app/guides/authentication)
- **Secure Cookies**: Use stateless sessions with secure, HTTP-only cookies. If using a database, prefer encrypted session IDs.[](https://nextjs.org/docs/pages/guides/authentication)
- **Middleware for Authorization**: Use Middleware for optimistic checks (e.g., redirecting unauthenticated users) but validate sensitive operations on the server.[](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- **Environment Variables**: Use `NEXT_PUBLIC_` prefix only for client-exposed variables. Keep secrets like `NEXTAUTH_SECRET` private.[](https://nextjs.org/docs/app/guides/migrating/from-create-react-app)
- **Edge Compatibility**: If deploying to Vercel Edge, ensure your database/ORM supports Edge runtime or use JWT sessions.[](https://authjs.dev/getting-started/migrating-to-v5)
- **Custom Pages**: Always implement custom sign-in/sign-out pages for better UX and branding.[](https://nextjs.org/docs/pages/guides/authentication)
- **Testing**: Test OAuth flows in staging environments, as rate limits differ between development and production.[](https://developer.auth0.com/resources/guides/web-app/nextjs/basic-authentication)

---

### 5. Common Pitfalls and Troubleshooting

- **Error: “Invalid compact JWE”**:
  - Cause: Mismatched `NEXTAUTH_SECRET`.
  - Fix: Ensure `NEXTAUTH_SECRET` is consistent across environments.
- **OAuth Callback Errors**:
  - Cause: Incorrect callback URL in provider settings.
  - Fix: Set callback URL to `http://localhost:3000/api/auth/callback/<provider>` in development and update for production.
- **Session Not Persisting**:
  - Cause: `SessionProvider` not wrapping client-side components.
  - Fix: Ensure `SessionProvider` is in `app/layout.js` or a Client Component.
- **Edge Runtime Errors**:
  - Cause: Incompatible database/ORM.
  - Fix: Use JWT sessions or an Edge-compatible ORM (e.g., Drizzle). Check provider documentation.[](https://authjs.dev/getting-started/migrating-to-v5)
- **Middleware Redirect Loops**:
  - Cause: Incorrect `matcher` config or session check logic.
  - Fix: Verify `matcher` paths and ensure `auth()` returns expected session data.

---

### 6. Additional Resources

- **Official Auth.js Documentation**: [authjs.dev](https://authjs.dev)
- **Auth.js v5 Migration Guide**: [Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5)[](https://authjs.dev/getting-started/migrating-to-v5)
- **Next.js Authentication Guide**: [nextjs.org/docs/guides/authentication](https://nextjs.org/docs/app/building-your-application/authentication)[](https://nextjs.org/docs/pages/guides/authentication)
- **Next.js 15 Upgrade Guide**: [nextjs.org/docs/app/building-your-application/upgrading](https://nextjs.org/docs/app/building-your-application/upgrading)[](https://nextjs.org/blog/next-15)
- **Example Project**: Check [Auth.js Next.js Example](https://github.com/nextauthjs/next-auth-example) or the template by @steventey on X.

---

This guide provides a comprehensive path to migrate from an older NextAuth.js version to Auth.js v5 in a Next.js App Router project without TypeScript. By following these steps, you’ll leverage modern Next.js features like Server Components and Server Actions while adhering to Auth.js best practices. If you encounter specific issues or need further customization (e.g., adding Credentials provider), let me know, and I can provide tailored guidance!
