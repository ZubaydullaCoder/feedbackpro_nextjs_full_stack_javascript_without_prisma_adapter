Okay, here is a comprehensive guide to integrating the latest version of NextAuth.js (v5, now officially part of the Auth.js project) into your modern Next.js App Router project using JavaScript, along with best practices and a migration guide from older versions.

**Current Date:** Saturday, May 3, 2025

**Note:** NextAuth.js v5 represents a significant shift, designed primarily for the Next.js App Router and Edge compatibility. It's now often referred to simply as Auth.js, and the primary package is `@auth/nextjs`.

---

## Comprehensive Guide: NextAuth.js (Auth.js v5) with Next.js App Router (JavaScript)

### 1. Introduction

Auth.js (formerly NextAuth.js) is a complete open-source authentication solution for modern web applications. Version 5 is rebuilt for the Next.js App Router, offering simplified configuration, better Edge support, and improved developer experience compared to v4. This guide focuses on setting it up in a JavaScript Next.js project.

### 2. Prerequisites

- A Next.js project (version 13.4 or later) using the App Router.
- Node.js installed.
- You are using JavaScript (`.js` or `.jsx` files), not TypeScript.

### 3. Installation

Install the core Auth.js library for Next.js and the React bindings:

```bash
npm install @auth/nextjs next-auth
# or
yarn add @auth/nextjs next-auth
# or
pnpm add @auth/nextjs next-auth
# or
bun add @auth/nextjs next-auth
```

- `@auth/nextjs`: The main library integration for Next.js v5.
- `next-auth`: While the core logic is in `@auth/nextjs`, the `next-auth` package is often still needed, especially for React components/hooks like `SessionProvider` and `useSession`. Check the official Auth.js documentation for the most current dependency requirements as the ecosystem evolves.

### 4. Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add the following:

```.env.local
# Generate a strong secret using: openssl rand -hex 32
# Required for signing/encrypting tokens and cookies
AUTH_SECRET="YOUR_STRONG_RANDOM_SECRET"

# Example for Google Provider (Add credentials for your chosen providers)
AUTH_GOOGLE_ID="YOUR_GOOGLE_CLIENT_ID"
AUTH_GOOGLE_SECRET="YOUR_GOOGLE_CLIENT_SECRET"

# Optional: Needed for some deployment platforms or complex proxy setups
# AUTH_URL="http://localhost:3000" # Development URL
# AUTH_URL="https://yourdomain.com" # Production URL

# Optional: Trust the host header from proxies (e.g., Vercel, Cloudflare)
# Set to "true" if needed
# AUTH_TRUST_HOST="true"

# Optional: Enable debug messages
# AUTH_DEBUG="true"
```

**Key Points:**

- **`AUTH_SECRET`**: Mandatory in production. It secures your sessions and tokens. Keep it secret!
- **Provider Variables**: Use the `AUTH_PROVIDER_ID` and `AUTH_PROVIDER_SECRET` format (e.g., `AUTH_GITHUB_ID`). Auth.js v5 automatically infers these if named correctly.
- **`AUTH_URL`**: Often inferred automatically based on request headers, but explicitly setting it can prevent issues in some environments.
- **Prefix:** Use the `AUTH_` prefix for environment variables (v4 used `NEXTAUTH_`).

### 5. Core Configuration (`auth.config.js` and `auth.js`)

Auth.js v5 splits configuration for better compatibility, especially with middleware.

**a) `auth.config.js` (Root of project)**

This file contains configuration options that need to be serializable (can be converted to simple data types), mainly for use in middleware which often runs in edge environments where database adapters might not work.

```javascript
// auth.config.js
/** @type {import('@auth/nextjs').NextAuthConfig} */
export const authConfig = {
  // Configure custom pages if needed (optional)
  pages: {
    signIn: "/login", // Redirect users to /login if they are not signed in
    // error: '/auth/error', // Error code passed in query string as ?error=
    // verifyRequest: '/auth/verify-request', // (used for check email message)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in
  },
  // Callbacks for additional control (optional)
  callbacks: {
    // This callback is called before middleware checks authorization
    // Use it to only allow access to certain pages if the user is authenticated
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true; // Allow access if logged in
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // Optionally redirect logged-in users from login page to dashboard
        if (nextUrl.pathname === "/login") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
      }
      // Allow access for all other routes by default
      return true;
    },
    // Add other callbacks as needed (jwt, session - see auth.js below)
  },
  providers: [
    // Add providers here if they are compatible with the Edge
    // Usually, you'll add providers in auth.js unless specifically needed here
    // for advanced middleware scenarios.
    // Example: Credentials provider often configured here if used with middleware checks
  ],
};
```

**b) `auth.js` (Root of project)**

This is the main configuration file where you'll set up most providers, adapters, session strategies, and detailed callbacks. It imports the `authConfig`.

```javascript
// auth.js
import NextAuth from "@auth/nextjs";
import { authConfig } from "./auth.config";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
// import { PrismaAdapter } from '@auth/prisma-adapter'; // Example adapter
// import { PrismaClient } from '@prisma/client'; // Example DB client

// const prisma = new PrismaClient(); // Initialize DB client if using adapter

export const {
  handlers: { GET, POST }, // API Route handlers
  auth, // Session management helper (server-side)
  signIn, // Sign-in function (server-side)
  signOut, // Sign-out function (server-side)
  unstable_update, // Function to update session (server-side)
} = NextAuth({
  // Merge base config
  ...authConfig,

  // Add Database Adapter (optional)
  // adapter: PrismaAdapter(prisma),

  // Session Strategy (jwt is default if no adapter)
  // session: { strategy: 'jwt' }, // Force JWT even with adapter
  session: { strategy: "database" }, // Use database sessions (requires adapter)

  // Add Authentication Providers
  providers: [
    Google({
      // clientId and clientSecret are automatically picked up from env vars
      // AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET
      // You can override them here if needed:
      // clientId: process.env.AUTH_GOOGLE_ID_OVERRIDE,
      // clientSecret: process.env.AUTH_GOOGLE_SECRET_OVERRIDE,
    }),
    Credentials({
      // You can provide a custom form on your sign-in page
      // Or use the built-in credentials form (/api/auth/signin)
      async authorize(credentials) {
        // Add logic here to look up the user from the credentials supplied
        console.log("Credentials received:", credentials);

        // Example validation (replace with your actual user lookup)
        // const user = await findUserByEmail(credentials.email);
        const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }; // Dummy user

        if (
          user /* && await bcrypt.compare(credentials.password, user.password) */
        ) {
          // Return user object (must contain at least `id`)
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          console.log("Invalid credentials");
          return null;
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
          // throw new Error("Invalid credentials provided");
        }
      },
    }),
    // Add other providers (GitHub, Email, etc.)
  ],

  // Add detailed callbacks here (override or extend from auth.config.js if needed)
  callbacks: {
    ...authConfig.callbacks, // Include callbacks from auth.config.js

    // Modify the session object (runs AFTER jwt callback)
    async session({ session, token /* user */ }) {
      // Send properties to the client, like an access_token and user.id from the token.
      // The `token` object contains data returned from the `jwt` callback or database session data.
      // The `user` object (if using database sessions) contains the user model from the database.
      if (token?.sub && session.user) {
        session.user.id = token.sub; // Add user ID to session
      }
      if (token?.role && session.user) {
        session.user.role = token.role; // Add custom role to session
      }
      // console.log("Session Callback - Session:", session);
      return session;
    },

    // Modify the JWT token (runs BEFORE session callback)
    async jwt({ token, user, account, profile, isNewUser }) {
      // This callback is called whenever a JWT is created (i.e. at sign in)
      // or updated (i.e whenever a session is accessed in the client).
      // `user`, `account`, `profile` and `isNewUser` are only passed on sign-in.
      // console.log("JWT Callback - Token:", token);
      // console.log("JWT Callback - User:", user); // Only available on sign-in
      // console.log("JWT Callback - Account:", account); // Only available on sign-in

      // Persist the OAuth access_token and user ID to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id; // Or token.sub = user.id (sub is standard JWT field for subject/user ID)
        // Add custom claims like role
        // token.role = user.role;
      }
      return token;
    },
  },
});
```

### 6. API Route Handler

Create the catch-all API route that Auth.js uses for handling sign-in, sign-out, callbacks, etc.

Create the file `app/api/auth/[...nextauth]/route.js`:

```javascript
// app/api/auth/[...nextauth]/route.js
import { handlers } from "@/auth"; // Referring to the auth.js we created

export const { GET, POST } = handlers;

// If you need to handle other methods separately:
// export async function PUT(request) { /* ... */ }
// export async function DELETE(request) { /* ... */ }

// Runtime preference (optional)
// export const runtime = "edge" // or "nodejs"
```

- Make sure your alias `@/` points to the root or `src/` directory correctly in `jsconfig.json` or `tsconfig.json`. If not using aliases, use relative paths like `import { handlers } from '../../../auth'`.

### 7. Middleware for Route Protection

Create a `middleware.js` file in the root of your project (or `src/` if using `src` directory) to protect routes.

```javascript
// middleware.js
import { auth } from "@/auth"; // Import the 'auth' function from auth.js
// Or import directly from auth.config if you defined `authorized` there and don't need the full NextAuth instance in middleware
// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';
// export const { auth: middleware } = NextAuth(authConfig)

export default auth; // Use the imported auth function directly as middleware

// Alternatively, wrap it if you need to use `req` object for custom logic before auth logic runs:
// export default auth((req) => {
//   console.log("Middleware running for:", req.nextUrl.pathname);
//   // Your custom logic here before auth verification
//   // Note: You cannot directly return a response here if you want the `authorized` callback to run
//   // Let the `auth` logic handle redirects based on the `authorized` callback in auth.config.js
// });

// Configuration for the middleware
export const config = {
  // Matcher specifies routes the middleware should run on.
  // Use positive lookaheads to exclude static files and API routes
  // Adjust the paths based on your application structure
  matcher: [
    "/dashboard/:path*", // Protect dashboard routes
    "/profile", // Protect profile page
    // Add other routes you want to protect
    // Example excluding specific routes like API, static files, images:
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // More complex example to protect everything EXCEPT specific public routes:
    // '/((?!api|_next/static|_next/image|favicon.ico|login|signup|public-page).*)',
  ],
};
```

- The `auth` function imported from `auth.js` will automatically use the `authorized` callback defined in your `auth.config.js` to determine access.

### 8. Session Provider for Client Components

To use the `useSession` hook in client components, you need to wrap your application (or relevant parts) in a `SessionProvider`.

**a) Create a Client Component Wrapper**

Create `components/SessionProviderWrapper.js`:

```javascript
// components/SessionProviderWrapper.js
"use client"; // This directive is essential

import { SessionProvider } from "next-auth/react";

export default function SessionProviderWrapper({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
```

**b) Use the Wrapper in Root Layout**

Import and use the wrapper in your root layout (`app/layout.js`):

```javascript
// app/layout.js
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
// Import your global styles, fonts, etc.
import "./globals.css";

export const metadata = {
  title: "My NextAuth App",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  // Note: You cannot fetch the session directly here in the root layout server component
  // if you need to pass it down to the client-side SessionProvider.
  // The SessionProvider fetches the session client-side automatically.
  // Passing `session` prop is generally needed for older Pages Router setups.
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          {" "}
          {/* Wrap the children */}
          {/* Add header, navbars, etc. here */}
          <main>{children}</main>
          {/* Add footer here */}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
```

### 9. Accessing Session Data

**a) Server Components**

Use the `auth()` helper function imported from `@/auth`.

```javascript
// Example: app/dashboard/page.js (Server Component)
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth(); // Get session data server-side

  if (!session?.user) {
    // This should ideally be handled by the middleware, but good as a fallback
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name || session.user.email}!</p>
      <p>Your ID: {session.user.id}</p> {/* Added via callbacks */}
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
```

**b) Client Components**

Use the `useSession` hook imported from `next-auth/react`. Make sure the component is rendered within the `<SessionProviderWrapper>`.

```javascript
// Example: components/UserProfile.js (Client Component)
"use client"; // Mark as client component

import { useSession } from "next-auth/react";

export default function UserProfile() {
  const { data: session, status } = useSession();
  // status can be 'loading', 'authenticated', or 'unauthenticated'

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>You are not signed in.</p>;
  }

  if (status === "authenticated") {
    return (
      <div>
        <h2>Client Component Profile</h2>
        <p>Signed in as {session.user?.name || session.user?.email}</p>
        <p>User ID: {session.user?.id}</p> {/* Added via callbacks */}
        {/* <pre>{JSON.stringify(session, null, 2)}</pre> */}
      </div>
    );
  }

  return null; // Should not happen
}
```

### 10. Sign-in and Sign-out Functionality

**a) Using Server Actions (Recommended for Forms)**

Create buttons within `<form>` elements that trigger Server Actions.

```javascript
// Example: components/AuthButtons.js (Can be Server or Client Component)
import { signIn, signOut } from "@/auth"; // Use server-side imports

function SignInButton({ provider, children }) {
  return (
    <form
      action={async () => {
        "use server"; // Mark the inline function as a Server Action
        await signIn(provider); // Pass provider ID (e.g., 'google', 'credentials')
      }}
    >
      <button type="submit">{children}</button>
    </form>
  );
}

function SignOutButton({ children }) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut(); // Optional: { redirectTo: '/login' }
      }}
    >
      <button type="submit">{children}</button>
    </form>
  );
}

// Example Usage (e.g., in your Header component)
export function Header() {
  // const session = await auth(); // Fetch session if needed server-side

  return (
    <nav>
      {/* Conditionally render buttons based on session */}
      {/* {!session ? ( */}
      <SignInButton provider="google">Sign in with Google</SignInButton>
      {/* Add sign in button for credentials if needed */}
      {/* ) : ( */}
      <SignOutButton>Sign Out</SignOutButton>
      {/* )} */}
    </nav>
  );
}
```

**b) Using Client Components (`onClick`)**

Import `signIn` and `signOut` from `next-auth/react`.

```javascript
// Example: components/ClientAuthButtons.js (Client Component)
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function ClientAuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading auth state...</p>;
  }

  return (
    <div>
      {status === "authenticated" ? (
        <>
          <span>Hi, {session.user?.name}!</span>
          <button onClick={() => signOut()}>Sign Out</button>
        </>
      ) : (
        <>
          <button onClick={() => signIn("google")}>Sign in with Google</button>
          {/* Add other provider sign-in buttons */}
        </>
      )}
    </div>
  );
}
```

### 11. Best Practices

- **`AUTH_SECRET`**: Always use a strong, unique secret, especially in production. Do not commit it to version control.
- **HTTPS**: Use HTTPS in production for secure cookie transmission.
- **CSRF Protection**: Enabled by default for POST routes (sign-in/sign-out). No extra setup is needed.
- **Callbacks**: Validate any data received in callbacks (e.g., from `unstable_update`). Sanitize inputs if dealing with credentials.
- **Environment Variables**: Keep secrets out of your code. Use the `AUTH_` prefix convention.
- **Middleware**: Use the `matcher` effectively to avoid running middleware on unnecessary routes (like static assets). Rely on the `authorized` callback for access control logic.
- **Adapters**: If using a database, choose an official adapter or ensure your custom adapter follows the required interface. Keep adapter logic outside `auth.config.js`.

---

## Migration Guide: NextAuth.js v4 to v5 (Auth.js)

Migrating from v4 involves several structural changes:

1.  **Package Name:**

    - Replace `next-auth` with `@auth/nextjs` in your `package.json`. You might still need `next-auth` for React components (`next-auth/react`). Run `npm install @auth/nextjs` and potentially `npm uninstall next-auth` followed by `npm install next-auth` if you encounter issues, or just update versions.

2.  **API Route:**

    - **v4:** `pages/api/auth/[...nextauth].js` exporting `NextAuth(authOptions)`.
    - **v5:** `app/api/auth/[...nextauth]/route.js` exporting `GET` and `POST` handlers from `import { handlers } from '@/auth'`.

3.  **Configuration File:**

    - **v4:** Typically a single `authOptions` object passed to `NextAuth` in the API route file.
    - **v5:** Split into `auth.config.js` (serializable, for middleware) and `auth.js` (main config, providers, adapters). The main `NextAuth` call is now in `auth.js`, exporting handlers and helpers. Move providers, adapters, detailed callbacks, and session strategy to `auth.js`. Move `pages` config and the `authorized` callback (if used for route protection) to `auth.config.js`.

4.  **Getting Session Data (Server-Side):**

    - **v4:** `import { getServerSession } from 'next-auth/next';` and `const session = await getServerSession(req, res, authOptions);` (in Pages Router `getServerSideProps` or API routes).
    - **v5 (App Router):** `import { auth } from '@/auth';` and `const session = await auth();` (directly in async Server Components or Route Handlers).

5.  **Getting Session Data (Client-Side):**

    - **v4/v5:** `import { useSession } from 'next-auth/react';` and `import { SessionProvider } from 'next-auth/react';`. The usage of `useSession` remains similar. The main difference is setting up the `SessionProvider` context for the App Router, typically by wrapping the root layout's children in a client component wrapper as shown above.

6.  **Middleware:**

    - **v4:** Often used `getToken` and manual checks, or the `withAuth` HOF.
    - **v5:** Create `middleware.js`. Import `auth` from `@/auth` (or `NextAuth(authConfig)`). Export `auth` directly as `middleware`. Define protected routes using the `config.matcher`. Use the `callbacks.authorized` in `auth.config.js` for authorization logic.

7.  **Environment Variables:**

    - **v4:** Prefixed with `NEXTAUTH_` (e.g., `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`).
    - **v5:** Prefixed with `AUTH_` (e.g., `AUTH_URL`, `AUTH_SECRET`). Provider variables are inferred if named `AUTH_{PROVIDER}_ID` / `AUTH_{PROVIDER}_SECRET`.

8.  **Adapters:**

    - Import paths may change (e.g., `@next-auth/prisma-adapter` -> `@auth/prisma-adapter`). Check the Auth.js documentation for the correct package names for your adapter. The core adapter interface is largely compatible. Install the new adapter package.

9.  **Sign-in/Sign-out:**
    - **v4 (Client):** `signIn()`, `signOut()` from `next-auth/react`.
    - **v5 (Client):** Same imports and usage from `next-auth/react`.
    - **v5 (Server Actions):** Import `signIn`, `signOut` from `@/auth` and use within server actions.

**Example Migration Steps:**

1.  Update dependencies in `package.json`.
2.  Create `auth.config.js` and move relevant serializable options (like `pages`, `callbacks.authorized`).
3.  Create `auth.js`, import `authConfig`, add providers, adapter, session strategy, and detailed callbacks (`jwt`, `session`). Export `handlers`, `auth`, `signIn`, `signOut`.
4.  Delete `pages/api/auth/[...nextauth].js`.
5.  Create `app/api/auth/[...nextauth]/route.js` and export `handlers`.
6.  Create `middleware.js` and set up protection using `export default auth` and `config.matcher`.
7.  Update server-side session fetching from `getServerSession` to `await auth()`.
8.  Ensure `SessionProvider` is set up correctly for client components in `app/layout.js`.
9.  Rename environment variables from `NEXTAUTH_` to `AUTH_`. Update provider variable names if necessary for auto-inference.
10. Update adapter import paths if used.

---

This guide provides a solid foundation for using Auth.js v5 with the Next.js App Router in JavaScript. Remember to consult the official Auth.js documentation (authjs.dev) for the most up-to-date information, advanced configurations, and provider-specific details.
