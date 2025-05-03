# FeedbackPro V1.0 - Development Breakdown (Updated for Full-Stack JS, No Prisma Adapter)

---

**(Using JavaScript, Google/Credentials Auth, JWT Sessions, Detailed Tasks/Checks)**

**Pre-Phase: Starting Point**

- **Assumption:** You have a basic Next.js 15 project (`feedbackpro`) created with App Router, Tailwind, ESLint (using JavaScript). Shadcn UI is initialized. `npm` is the package manager. Git repo initialized. NeonDB account ready.

**Phase 1: Core Dependencies, DB Setup & Structure (Updated)**

- **1. Goal:** Install necessary libraries, set up Prisma schema _without_ standard adapter models but _with_ necessary user fields, connect to DB, create project structure, integrate `Toaster`.
- **2. Tasks (for AI Assist):**
  - Run `npm install prisma @prisma/client zod react-hook-form next-auth@beta bcrypt jsonwebtoken resend qrcode @tanstack/react-query @tanstack/react-query-devtools`. _(Note: No `@auth/prisma-adapter`)_.
  - Run `npm install --save-dev @types/bcrypt`.
  - Run `npx prisma init`.
  - Define `datasource db` in `prisma/schema.prisma`.
  - Define **only** the `User` model in `prisma/schema.prisma`. Include fields necessary for your application logic and the chosen auth methods:
    - `id` (String, cuid/uuid)
    - `email` (String, unique - **required** if using email as primary identifier for both Credentials/Google linking)
    - `name` (String, optional)
    - `image` (String, optional, from Google)
    - `hashedPassword` (String, optional - for Credentials users)
    - `emailVerified` (DateTime, optional)
    - `googleId` (String, optional, unique - identifier from Google)
    - `role` (UserRole enum - BUSINESS_OWNER, ADMIN)
    - `isActive` (Boolean, default true - for Admin control)
    - `createdAt`, `updatedAt`
    - _(Note: No Account, Session, VerificationToken models from standard adapter)_
  - Define the `UserRole` enum in `prisma/schema.prisma`.
  - Create `.env` and `.env.example` files. Add `DATABASE_URL` (direct URL), `NEXTAUTH_SECRET`, `NEXTAUTH_URL=http://localhost:3000`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET` (can be same as NEXTAUTH_SECRET or separate), `RESEND_API_KEY`. Add `.env` to `.gitignore`.
  - Run `npx prisma migrate dev --name init-custom-user-model`.
  - Create project structure directories (same as before: `app/(groups)`, `components/*`, `lib/*`, etc.).
  - Install Shadcn `toast` and `toaster`: `npx shadcn-ui@latest add toast toaster`.
  - Add `<Toaster />` to `app/layout.jsx`.
  - Create `lib/prisma.js` with Prisma Client singleton logic.
- **3. Check Instructions (Detailed):**
  - Verify dependencies installed (`package.json`).
  - Confirm `prisma/schema.prisma` has _only_ the custom `User` model (no Account/Session/VerificationToken models).
  - Confirm migration ran successfully (check `prisma/migrations` and DB structure via `npx prisma studio`). `User` table should exist with specified fields.
  - Verify required directories exist.
  - Run `npm run dev`. App starts without errors.
  - Verify `Toaster` is present in rendered HTML.
  - Confirm `lib/prisma.js` exists and exports client instance.

**Phase 2: Authentication Implementation (No Adapter / JWT)**

- **1. Goal:** Implement Google & Credentials auth using NextAuth.js v5 **without the Prisma Adapter**, relying on JWT sessions and manual DB interaction in callbacks.
- **2. Tasks (for AI Assist):**
  - Create `lib/auth.js`. Import `NextAuth`, providers (`Google`, `Credentials`), `bcrypt`, `prisma` client.
  - Configure `NextAuth` within `lib/auth.js`:
    - Set **`session: { strategy: "jwt" }`**.
    - Configure `Google` provider (Client ID/Secret).
    - Configure `Credentials` provider:
      - Define `authorize` async function: Receives `credentials`. Find user by `credentials.email` (Prisma). If user exists and `hashedPassword` is set, verify `credentials.password` against `hashedPassword` using `bcrypt.compare`. If valid, return user object `{ id, email, name, image, role }`. If invalid or user not found, return `null`.
    - **Implement `callbacks`:**
      - **`jwt({ token, user, account, profile })`:**
        - _Initial Sign-In (Google):_ If `account.provider === 'google'` and `user` exists (passed on first login after Google auth):
          - Use `profile.sub` (Google ID) and `profile.email`.
          - Try finding user by `googleId` (Prisma). If found, update name/image if needed.
          - If not found by `googleId`, try finding by `email`. If found, **link account** by setting `googleId` on the existing user record (Prisma update). Handle case where email exists but is linked to a different Google ID or has password (potential conflict).
          - If no user found by `googleId` or `email`, create a _new_ user with Google details, `role: 'BUSINESS_OWNER'`, `isActive: true` (Prisma create).
          - Set `token.sub = dbUser.id` (your internal user ID).
          - Set `token.role = dbUser.role`.
          - Set `token.isActive = dbUser.isActive`.
        - _Initial Sign-In (Credentials):_ If `user` exists (passed from `authorize`):
          - Set `token.sub = user.id`.
          - Set `token.role = user.role`. // Fetch role if needed
          - Set `token.isActive = user.isActive`. // Fetch status if needed
        - _Subsequent Requests:_ Return the existing `token`.
      - **`session({ session, token })`:**
        - Set `session.user.id = token.sub`.
        - Set `session.user.role = token.role`.
        - Set `session.user.isActive = token.isActive`.
        - _(Optional: Populate name/email/image from token if added in `jwt` callback)_.
    - Set `pages: { signIn: '/login' }`.
    - Add `NEXTAUTH_SECRET`.
    - Export `{ handlers, auth, signIn, signOut }`.
  - Create API route handler `app/api/auth/[...nextauth]/route.js` (exports handlers).
  - Create `components/shared/providers.jsx` (marked `"use client"`) using `SessionProvider` from `next-auth/react`. Use in `app/layout.jsx`.
  - Create Login page (`app/(auth)/login/page.jsx`) and `components/features/auth/login-form.jsx` (client component).
    - Email/Password fields + "Sign in" button triggering `signIn('credentials', { email, password, redirect: false })`. Handle result (success/error) and show toasts. Redirect manually on success.
    - "Sign in with Google" button triggering `signIn('google')`.
  - Create Register page (`app/(auth)/register/page.jsx`) and `components/features/auth/register-form.jsx` (client component).
  - Create Server Action `lib/actions/auth.actions.js` -> `registerUser(formData)`:
    - Extract email/password. Validate (Zod). Check if email exists (Prisma). Hash password (`bcrypt`). Create user (Prisma) with `hashedPassword`, `role: 'BUSINESS_OWNER'`, `isActive: true`. Return success/error.
  - Call `registerUser` from register form. Show toasts. Redirect to `/login` on success. _(Note: User must explicitly log in after registering)_.
  - Create protected page `app/(bo)/dashboard/page.jsx`. Use `await auth()` from `@/lib/auth` to get session (which is derived from JWT). Check `session.user.isActive`. Redirect if no session or inactive.
  - Add Sign Out button calling `signOut()` from `next-auth/react`.
- **3. Check Instructions (Detailed):**
  - Navigate to `/register`. Register user. Verify success toast, DB record (check `hashedPassword`, `role`), redirection to `/login`.
  - Navigate to `/login`. Log in with credentials. Verify success toast, redirection to `/dashboard`. Check JWT content using browser dev tools or `jwt.io` (look for `sub`, `role`, `isActive`).
  - Access `/dashboard`. Verify user info displayed (from session). Sign out. Verify redirect. Verify `/dashboard` access blocked.
  - Log out. Navigate to `/login`. Click "Sign in with Google". Complete flow. Verify redirection to `/dashboard`. Verify DB record (check `googleId` is set, potentially name/image updated). Check JWT content. Sign out.
  - _(Optional Link Test):_ Register with email A. Log out. Sign in with Google using account associated with email A. Verify you log into the _same_ user account (check session user ID, check DB user record has both `hashedPassword` and `googleId`).

**Phase 3: Core Survey Management (BO) (Updated)**

- **1. Goal:** Enable BOs to create, view basic surveys and generate QR codes in the full-stack setup.
- **2. Tasks (for AI Assist):**
  - Update `prisma/schema.prisma` (add `Business`, `Survey`, `Question` models, relations). Run `npx prisma migrate dev --name add-survey-models`.
  - Create BO layout `app/(bo)/layout.jsx`.
  - Create "Create Survey" page `app/(bo)/surveys/new/page.jsx` + form `components/features/surveys/survey-form.jsx` (client).
  - Create Server Action `lib/actions/survey.actions.js` -> `createSurvey(formData)`:
    - **Use `auth()` helper** from `@/lib/auth` to get session/user ID/role. Verify user is authenticated BO and active.
    - Validate input (Zod).
    - Find/Create user's `Business` (Prisma).
    - Create `Survey` and `Question` records (Prisma).
    - Return success/error.
  - Call action from form. Show toasts. Redirect.
  - Create "List Surveys" page `app/(bo)/surveys/page.jsx`. **Use `auth()`** to get user ID. Fetch surveys via Prisma. Pass data to display component.
  - Create "View Survey Details" page `app/(bo)/surveys/[surveyId]/page.jsx`. **Use `auth()`**. Fetch details via Prisma.
  - Create API route `app/api/survey/[surveyId]/qr/route.js` (same as before).
  - Add QR display/link to details page.
- **3. Check Instructions (Detailed):**
  - Log in as BO. Navigate to `/surveys/new`. Create survey. Verify success toast, redirection, DB records.
  - Navigate to `/surveys`. Verify survey listed.
  - Click survey. Verify details page shows data.
  - Verify QR code loads and has correct URL.

**Phase 4: Core Feedback Submission & Viewing (Consumer & BO) (Updated)**

- **1. Goal:** Allow consumers (QR) and BOs (view read-only) feedback flow in full-stack setup.
- **2. Tasks (for AI Assist):**
  - Update `prisma/schema.prisma` (add `ResponseEntity`, `Response` models). Run `npx prisma migrate dev --name add-response-models`.
  - Create public survey page `app/(public)/s/[surveyId]/page.jsx`. Fetch survey/questions (Prisma). Pass data to form.
  - Create `components/features/feedback/survey-display-form.jsx` (client). Call Server Action on submit.
  - Create Server Action `lib/actions/feedback.actions.js` -> `submitFeedback(...)`: (Logic mostly same as before, uses Prisma).
  - Call action from form. Show consumer toast.
  - Update BO survey details page (`app/(bo)/surveys/[surveyId]/page.jsx`). **Use `auth()`**. Fetch associated `Response` data (Prisma). Display read-only.
- **3. Check Instructions (Detailed):**
  - Access public QR link `/s/[surveyId]`. Verify survey loads.
  - Submit feedback. Verify consumer success toast. Verify DB records (`ResponseEntity` type QR, `Response` data).
  - Log in as BO, view survey details. Verify responses are displayed read-only.

**Phase 5: SMS Feedback Channel (Updated)**

- **1. Goal:** Implement SMS sending and unique link feedback flow in full-stack setup.
- **2. Tasks (for AI Assist):**
  - Set up SMS Provider SDK/helper (`lib/sms/sendSms.js`). Add keys to `.env`.
  - Add UI to BO survey details page for SMS sending.
  - Create Server Action `lib/actions/sms.actions.js` -> `sendFeedbackSms(...)`:
    - **Use `auth()`** to verify BO is logged in/active.
    - Validate phone number.
    - Create `ResponseEntity` (Prisma, type=SMS).
    - Generate unique URL `/feedback/[responseEntityId]`.
    - Call `sendSms` helper. Handle errors.
    - Return success/error.
  - Call action from BO UI. Show BO toast.
  - Create unique feedback page `app/(public)/feedback/[responseEntityId]/page.jsx`. Fetch entity/survey (Prisma). Show error/message if already completed. Pass data to display form.
  - Ensure `submitFeedback` action correctly handles SMS `responseEntityId` and prevents re-submission.
  - Update BO survey details page. **Use `auth()`**. Fetch/display SMS responses. Implement SMS tracking list (fetch `ResponseEntity` type SMS via Prisma).
- **3. Check Instructions (Detailed):**
  - Log in as BO, send SMS. Verify BO toast. Verify DB `ResponseEntity` (type SMS).
  - _(Simulate)_ Open unique URL `/feedback/[responseEntityId]`. Verify survey loads.
  - Submit feedback. Verify consumer success toast. Verify DB `ResponseEntity` status -> COMPLETED. Verify `Response` records.
  - _(Simulate)_ Try opening unique URL again. Verify completion message/blocked submission.
  - Log in as BO, view survey details. Verify SMS response displayed. Verify SMS tracking list shows "Completed".

**Phase 6: Incentive Mechanism (SMS) (Updated)**

- **1. Goal:** Implement discount code generation/display (SMS) and BO verification/redemption in full-stack setup.
- **2. Tasks (for AI Assist):**
  - Update `prisma/schema.prisma` (add `DiscountCode` model). Run `npx prisma migrate dev --name add-discount-code`.
  - Modify `lib/actions/feedback.actions.js` -> `submitFeedback`: Generate/save `DiscountCode` (Prisma) for SMS type, return code.
  - Update consumer UI (`components/features/feedback/survey-display-form.jsx`) to show code.
  - Create BO "Verify Code" page `app/(bo)/verify-code/page.jsx` + form `components/features/incentive/verify-code-form.jsx` (client).
  - Create Server Actions `lib/actions/incentive.actions.js`:
    - `verifyDiscountCode(code)`: **Use `auth()`** to check BO auth. Find code (Prisma). Return status.
    - `redeemDiscountCode(code)`: **Use `auth()`**. Find code, check status, update status (Prisma). Return success/error.
  - Call actions from verify form. Display status/toasts. Manage button states.
- **3. Check Instructions (Detailed):**
  - Submit feedback via SMS link. Verify code displayed. Verify DB `DiscountCode`.
  - Log in as BO, go to `/verify-code`. Verify invalid code -> "Invalid" toast. Verify valid code -> "Valid" toast, Redeem enabled.
  - Redeem code -> Success toast, button disabled/status update. Verify DB status -> REDEEMED.
  - Verify same code again -> "Redeemed" toast.

**Phase 7: Admin Basics (Updated)**

- **1. Goal:** Implement Admin login and basic BO user management in full-stack setup.
- **2. Tasks (for AI Assist):**
  - Create Admin user in DB (`role: 'ADMIN'`).
  - Ensure login logic (Credentials `authorize` or Google `jwt` callback in `lib/auth.js`) correctly identifies Admin role.
  - Create Admin layout `app/(admin)/layout.jsx`.
  - Implement route protection for `/admin/*` using `middleware.js`:
    - Import `auth` from `@/lib/auth`.
    - Check `req.auth?.user?.role === 'ADMIN'` and `req.auth?.user?.isActive`. Redirect if not.
  - Create "Manage Users" page `app/(admin)/users/page.jsx`. **Use `auth()`**. Fetch BO users (Prisma). Pass data.
  - Create `components/features/admin/user-management-table.jsx` (display list, Activate/Deactivate buttons calling actions).
  - Ensure `User` model has `isActive` field (from Phase 1 update or add now).
  - Create Server Action `lib/actions/admin.actions.js` -> `setUserActiveStatus(...)`:
    - **Use `auth()`** to verify current user is ADMIN.
    - Update target user's `isActive` (Prisma).
    - Return success/error.
  - Call action from table buttons. Update UI / refetch. Show Admin toast.
- **3. Check Instructions (Detailed):**
  - Log in as Admin. Access `/admin/users`. Verify BO list.
  - Log in as BO. Try accessing `/admin/users`. Verify redirect/denied.
  - As Admin, deactivate BO. Verify toast, DB update.
  - As Admin, activate BO. Verify toast, DB update.

**Phase 8: MVP Refinement & Manual Testing (Updated)**

- **1. Goal:** Ensure workflows function, toasts provide feedback, basic responsiveness, and login checks inactive users in full-stack setup.
- **2. Tasks (for AI Assist):**
  - Review Server Actions and client components calling them. Ensure consistent success/error toast implementation (`useToast`).
  - Ensure the Credentials provider `authorize` function in `lib/auth.js` checks the fetched user's `isActive` status and returns `null` if inactive.
  - Perform manual end-to-end testing flows (BO register->login->survey->QR->submit->view; BO login->survey->SMS->submit->code->view->verify->redeem; Admin login->users->activate/deactivate). Verify all steps work and toasts appear.
  - Check responsiveness on common device sizes. Apply basic Tailwind fixes if needed.
  - Test login attempt as a deactivated user (via Admin panel). Verify login fails with an appropriate toast/message.
- **3. Check Instructions (Detailed):**
  - Confirm all async actions show success/error toasts.
  - Confirm deactivated users cannot log in via Credentials provider.
  - Confirm basic UI usability on desktop/mobile.
  - Confirm end-to-end flows are functional without major bugs.

**Phase 9: Deployment Preparation (Updated)**

- **1. Goal:** Prepare the full-stack application for deployment.
- **2. Tasks (for AI Assist):**
  - Remove debugging `console.log`s.
  - Update `.env.example` with all required production variables: `DATABASE_URL` (**pooled** connection string), `NEXTAUTH_URL` (production), `NEXTAUTH_SECRET`, `JWT_SECRET` (if separate), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, SMS provider keys.
  - Run `npm run build` locally.
- **3. Check Instructions (Detailed):**
  - Confirm `npm run build` finishes successfully without errors.
  - Confirm `.env.example` is complete and accurate for production setup.

---

This revised breakdown aligns with the full-stack Next.js (JavaScript) approach, removes the Prisma adapter dependency (requiring manual DB logic in auth callbacks), uses JWT sessions, and maintains the detailed task/check structure suited for AI assistance. Remember the added complexity this brings to the authentication implementation (Phase 2).
