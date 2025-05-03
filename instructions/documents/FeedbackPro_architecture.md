# FeedbackPro V1.0 - Design & Architecture Documentation (Updated: Full-Stack JS, NextAuth v5 without Adapter)

---

**1. Introduction**

- **Purpose:** This document describes the technical architecture and design decisions for the FeedbackPro V1.0 application, built as a **full-stack Next.js application** using **JavaScript**. It outlines the structure, technology choices, and key patterns.
- **Scope:** Focuses on the MVP architecture. Authentication uses **NextAuth.js v5** with **Google and Credentials providers**. Crucially, the **official Prisma adapter for NextAuth.js will _not_ be used**, necessitating manual database interaction within authentication callbacks and mandating the use of **JWT sessions**.
- **Key Considerations:** The manual handling of user persistence within NextAuth.js callbacks adds complexity compared to using the adapter. The choice of **JavaScript** requires strong runtime validation discipline.
- **References:** Complements PRD, Project Structure, Development Breakdown, NextAuth.js v5 & TanStack Query v5 Integration Guides (adapting for JS and no adapter).

**2. System Architecture Overview**

- **Concept:** FeedbackPro V1.0 is a monolithic **full-stack Next.js application**. It handles frontend rendering (React), backend API logic (Server Actions, Route Handlers), user authentication (NextAuth.js), database interactions (Prisma), and external service calls (SMS, Email) within a single codebase and deployment unit.
- **High-Level Components & Interaction Flow:**
  - `(Diagram Placeholder):` _Diagram description should show:_
    - `User Browser` -> interacts with -> `Next.js Application (Vercel)`
    - `Next.js Application` contains:
      - `Frontend (React RSC/Client Components)`
      - `Backend Logic (Server Actions / Route Handlers)`
      - `Authentication (NextAuth.js Core + Callbacks)`
      - `ORM (Prisma Client)`
    - `Next.js Application` -> interacts with -> `PostgreSQL Database (NeonDB)`
    - `Next.js Application` -> interacts with -> `External SMS Service API`
    - `Next.js Application` -> interacts with -> `External Email Service API (Resend)`
- **Key Components & Responsibilities:**
  - **Next.js Application:** Provides the unified platform for:
    - **Frontend:** UI rendering, user interaction, client state (TanStack Query).
    - **Backend Logic/API:** Business logic via Server Actions and Route Handlers, data validation (Zod), database access (Prisma), external API calls.
    - **Authentication:** Manages Google/Credentials flows via NextAuth.js v5; **manual database logic within callbacks** handles user lookup/creation/updates; issues and validates **JWT sessions**.
  - **Database (PostgreSQL on NeonDB):** Persistent storage, accessed via Prisma from the Next.js application logic.
  - **External Services:** SMS & Email APIs called directly from Next.js backend logic (Server Actions/Route Handlers).

**3. Technology Stack**

- **Framework:** Next.js 15 (App Router)
- **Language:** JavaScript (ES2020+)
- **UI:** React.js, Tailwind CSS v3, Shadcn UI, Lucide Icons
- **State Management:** TanStack Query v5 (Client Server State)
- **Database:** PostgreSQL (on NeonDB)
- **ORM:** Prisma (used with JavaScript)
- **Authentication:** **NextAuth.js v5 (beta)** - Configured with **Google & Credentials** providers. **JWT Session Strategy ONLY.** **NO Prisma Adapter.**
- **Form Handling:** React Hook Form + Zod
- **Password Hashing:** `bcrypt` (for Credentials provider)
- **External Services:** Resend (Email), Placeholder SMS Provider SDK
- **Deployment:** Vercel

**4. Frontend Architecture**

- **Paradigm:** Next.js App Router (RSC default, Client Components (`"use client"`) for interactivity).
- **Component Strategy:** Standard organization (`components/ui`, `shared`, `features`). JSDoc recommended for clarity in JS.
- **Styling:** Tailwind CSS utility-first, Shadcn UI base.
- **State Management:** TanStack Query manages client-side cache and interaction with server state (fetched via Server Actions or Route Handlers). Local UI state via React hooks. Client-side auth state managed using `next-auth/react`'s `useSession` hook (which reads the JWT session managed by NextAuth.js).
- **Authentication UI:** Uses `signIn` and `signOut` functions from `next-auth/react`. Login/Register forms interact with custom Server Actions (for registration) or the NextAuth.js Credentials flow.

**5. Backend Architecture (API Layer within Next.js)**

- **API Strategy:** **Server Actions** are the primary way to handle mutations and form submissions. **Route Handlers** used for specific GET requests (e.g., QR code generation) and the required NextAuth.js endpoint (`/api/auth/[...nextauth]/route.js`).
- **Authentication (NextAuth.js v5 - No Adapter):**
  - **Configuration:** Defined centrally (e.g., `lib/auth.js`).
  - **Session Strategy:** Must be explicitly set to **`session: { strategy: 'jwt' }`**.
  - **Providers:** Google and Credentials configured. Credentials provider's `authorize` function needs manual user lookup and password verification (`bcrypt.compare`) using Prisma.
  - **Callbacks (Manual DB Logic):**
    - **`jwt({ token, user, account, profile })`:** This callback is critical. It must contain Prisma logic to:
      - Find existing user by `googleId` or `email` on Google sign-in.
      - Create a new user record (Prisma `create`) if no user found after Google sign-in (using profile data).
      - Handle potential account linking logic (e.g., if Google email matches an existing Credentials user).
      - Retrieve the internal user ID (`dbUser.id`), `role`, and `isActive` status from the database.
      - Add required user data (`sub: dbUser.id`, `role: dbUser.role`, `isActive: dbUser.isActive`, potentially name/email) to the `token` object being returned. This data will be encoded into the JWT.
    - **`session({ session, token })`:** Populates the `session.user` object (used by `useSession` and `auth()`) using the data previously added to the `token` in the `jwt` callback (e.g., `session.user.id = token.sub`, `session.user.role = token.role`). Avoid DB calls here if possible; rely on the JWT payload.
- **Authorization:** RBAC checks performed within Server Actions / Route Handlers by retrieving the session using the `auth()` helper (from `lib/auth.js`) and inspecting `session.user.role` and `session.user.isActive`.
- **Data Validation:** Zod schemas validate inputs within Server Actions/Route Handlers before database operations.

**6. Data Layer Architecture**

- **Database:** NeonDB/PostgreSQL.
- **ORM:** Prisma (JS Client) used directly within Server Actions or other backend logic modules.
- **Schema:** `prisma/schema.prisma` defines models. Requires a `User` model with fields supporting Credentials (`hashedPassword`) and Google (`googleId`) login, plus application fields (`role`, `isActive`). **Standard NextAuth adapter models (`Account`, `Session`, `VerificationToken`) are not used.**
- **Data Integrity:** DB constraints + Zod validation + Application logic (e.g., feedback immutability enforced in Server Actions).

**7. External Service Integrations**

- Calls to SMS/Email (Resend) providers made from Server Actions or Route Handlers using their respective SDKs. Password reset email logic resides within custom actions.

**8. Key Design Decisions & Patterns (Updated)**

- **Decision 1: Full-Stack Next.js Architecture.**
- **Decision 2: Use Server Actions for Mutations.**
- **Decision 3: Utilize Shadcn UI for Base Components.**
- **Decision 4: Enforce Feedback Immutability (in Actions).**
- **Decision 5: Use NeonDB/Prisma.**
- **Decision 6: Structure Code with Clear Separation (e.g., `components/`, `lib/`).**
- **Decision 7: Use JavaScript.** (Implications: requires strong runtime validation/testing).
- **Decision 8: Use NextAuth.js v5 (Google/Credentials).**
- **Decision 9: Do NOT use Prisma Adapter for NextAuth.js.**
  - _Rationale:_ User preference.
  - _Implications:_ Requires **manual database logic in callbacks**, mandates **JWT sessions**, increases complexity/potential for error in auth flow compared to using adapter.
- **Decision 10: Use JWT Session Strategy.** (Necessitated by Decision 9).

**9. Security Considerations**

- Secure JWT handling via NextAuth.js (requires strong `NEXTAUTH_SECRET`).
- Secure password hashing (`bcrypt`) implemented correctly for Credentials registration/login.
- Rigorous server-side input validation (Zod).
- CSRF protection (partially handled by NextAuth.js, especially with JWTs).
- HTTPS (Vercel).
- Secure secret management.
- RBAC checks in backend logic.

**10. Performance Considerations**

- Leverage Next.js App Router benefits (RSCs, Server Actions co-location).
- Use TanStack Query for client-side caching.
- NeonDB/Prisma query efficiency.
- Vercel Edge deployment.

---

This document now reflects the full-stack Next.js architecture using JavaScript and NextAuth.js v5, specifically outlining the implications and requirements of _not_ using the Prisma adapter, relying instead on JWT sessions and manual database logic within the authentication callbacks.
