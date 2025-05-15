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

- **Pre-Phase 5 Refactoring: Aligning QR Code Flow with Rewardable SMS Mechanism**
  - **1. Goal:** Modify the existing QR code feedback flow (from Phase 4) to route users through an SMS opt-in. This enables rewards for QR-initiated feedback by using the same unique, single-use SMS link mechanism planned for direct BO SMS invites.
  - **2. Rationale:** To make QR-code initiated feedback eligible for rewards (Phase 6), we need a way to issue a unique, trackable link. Direct anonymous submission via `/s/[surveyId]` is unsuitable for rewards. This change standardizes rewardable feedback through unique SMS links.
  - **3. Tasks (for AI Assist):**
    - **3.1. Repurpose Public Survey Entry Page (`app/(public)/s/[surveyId]/page.jsx`):**
      - **Data Fetching:** This page will still fetch basic survey information (e.g., `survey.name`, `survey.business.name`) to display context to the user. It no longer needs to fetch survey questions.
      - **UI Change:**
        - Remove the direct rendering of `SurveyDisplayForm`.
        - The page will now display the survey name and a prompt for the user to enter their phone number to receive the survey link via SMS.
        - Integrate a new client component: `components/features/feedback/phone-number-opt-in-form.jsx`.
    - **3.2. Create `PhoneNumberOptInForm.jsx`:**
      - Location: `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\components\features\feedback\phone-number-opt-in-form.jsx`
      - Client component (`"use client"`).
      - UI: An input field for the phone number (use Shadcn `Input`) and a submit button (Shadcn `Button`).
      - Form Handling: Use `react-hook-form` and `zod` for phone number validation (e.g., basic E.164 format).
      - On Submit: Call a new server action `requestSurveyLinkViaSms`, passing `surveyId` and `phoneNumber`.
      - Feedback: Handle loading states (disable button, show spinner). Display success toast (e.g., "SMS on its way!") or error toast using `useToast`. After successful submission, the form could be replaced by a confirmation message.
    - **3.3. Create Server Action `requestSurveyLinkViaSms`:**
      - Location: `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\lib\actions\sms.actions.js` (or a new `feedback_request.actions.js` if preferred for organization).
      - Parameters: `({ surveyId, phoneNumber })`.
      - Validation: Use Zod for `surveyId` (cuid) and `phoneNumber`.
      - Logic:
        - Verify `surveyId` corresponds to an existing, active survey (Prisma query).
        - Create a `ResponseEntity` record (Prisma):
          - `surveyId`: from input.
          - `type`: `'QR_INITIATED_SMS'` (to distinguish from BO-sent SMS).
          - `status`: `'PENDING'`.
          - `phoneNumber`: Store the validated `phoneNumber` (consider privacy implications if this data is sensitive and not strictly needed long-term beyond sending the initial SMS).
        - Generate unique feedback URL: `const uniqueUrl = \`\${process.env.NEXTAUTH_URL}/feedback/\${newResponseEntity.id}\`;`.
        - Call the (simulated) `sendSms` helper: `await sendSms(validatedPhoneNumber, \`Here is your link for the \${survey.name} survey: \${uniqueUrl}\`);`
        - Return success/error object for the client.
    - **3.4. Modify `submitFeedback` Server Action (`lib/actions/feedback.actions.js`):**
      - **Remove `type` from input schema:** The `type` field (previously 'QR' or 'SMS') in the `submitFeedbackSchema` is no longer needed. All submissions will now be identified by `responseEntityId`.
      - **Remove logic for creating new `ResponseEntity` of type 'QR':** The action should no longer create a `ResponseEntity` on its own. It will _always_ expect a `responseEntityId` to be passed in.
      - **Adapt input schema:** The `submitFeedbackSchema` should now require `responseEntityId: z.string().cuid()`.
      - **Core Logic:**
        - Fetch the `ResponseEntity` using the provided `responseEntityId`.
        - **Crucial Check:** Verify `responseEntity` exists and `responseEntity.status === 'PENDING'`. If not, return an error (e.g., "Feedback already submitted or link is invalid.").
        - Proceed to create `Response` records and link them to this `responseEntityId`.
        - Atomically (Prisma transaction) update the `ResponseEntity` status to `'COMPLETED'` and set `submittedAt`.
    - **3.5. Update `SurveyDisplayForm.jsx` (`components/features/feedback/survey-display-form.jsx`):**
      - **Props:** This component will now receive `responseEntityId` as a prop from its parent page (`app/(public)/feedback/[responseEntityId]/page.jsx`).
      - **Data Submission:** When calling `submitFeedback`, pass the `responseEntityId` along with `surveyId` and `answers`. Remove the hardcoded `type: "QR"`.
      - **Local Storage `feedbackSubmitted_${survey.id}`:** This client-side check can be removed or re-evaluated. The primary mechanism for preventing re-submission is now the server-side check of `ResponseEntity.status` based on the unique `responseEntityId` in the URL. The unique link itself serves as the gate.
  - **4. Check Instructions (Refactoring):**
    - Navigate to a QR code link (e.g., `/s/your-survey-id`).
    - Verify the page displays survey context (name) and a form to enter a phone number, not the full survey.
    - Enter a valid phone number and submit.
    - Verify a (simulated) SMS is logged in the server console, containing a unique URL like `/feedback/[generated-response-entity-id]`.
    - Verify a new `ResponseEntity` record is created in the database with `type: 'QR_INITIATED_SMS'`, `status: 'PENDING'`, and linked to the correct `surveyId`.
    - Access the unique URL from the console log.
    - Verify the full survey loads correctly (via `SurveyDisplayForm`).
    - Submit feedback through this unique link.
    - Verify the `ResponseEntity` status is updated to `COMPLETED` in the database.
    - Verify the `Response` records are created and correctly associated.
    - Attempt to access the same unique URL again. Verify the "Feedback already submitted" message (or equivalent) is shown, and the form is not rendered (this logic is in `app/(public)/feedback/[responseEntityId]/page.jsx`).

---

**Phase 5: SMS Feedback Channel (Incorporating Refactored QR Flow)**

- **1. Overall Goal:** Implement the (simulated) SMS sending capability for Business Owners to invite recipients to surveys, and enable feedback submission via these unique links. This phase also builds upon the refactored QR flow, where QR scans now also lead to an SMS-delivered unique link.

- **2. Prerequisite: Simulated SMS Sending Setup (as per previous plan, if not already done)**

  - **2.1. Task:** Create/ensure a helper module to simulate SMS sending. This module will log the intended SMS details.
  - **2.2. Detailed Steps & Considerations:**
    - **Simulated SMS Helper Module:**
      - File: `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\lib\sms\sendSms.js`
      - Content: `async function sendSms(to, body)` that logs `[SMS SIMULATION] To: ${to}, Body: ${body}` and returns `{ success: true }`.
  - **2.3. Check Instructions (Prerequisite):**
    - Confirm `lib/sms/sendSms.js` exists, exports `sendSms`, and logs correctly when called.

- **3. Business Owner UI for Sending Direct SMS Invites**

  - **3.1. Task:** Add UI elements to the Business Owner's survey details page to input a phone number and trigger sending a (simulated) SMS with the unique survey link.
  - **3.2. Detailed Steps & Considerations:**
    - **File to Modify:** `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\components\features\surveys\survey-details-client.jsx`. Consider a new sub-component (e.g., `SmsInviteForm.jsx`) if UI/logic is substantial.
    - **UI Elements (Shadcn UI & Tailwind CSS):**
      - Input field for phone number (Shadcn `Input`).
      - Button "Send SMS Invite" (Shadcn `Button`).
      - Form handling: `react-hook-form` for validation and state.
    - **Functionality:**
      - On submit, call `sendDirectFeedbackSms` server action (see step 4), passing `surveyId` and `phoneNumber`.
      - Display success/error toasts using `useToast`.
    - **Best Practices:** UI/UX (clear labels, feedback), Modularity.
    - **Reusable Assets:** Shadcn components, `useToast`, `react-hook-form`.
  - **3.3. Check Instructions (BO UI for SMS):**
    - Verify UI elements render on survey details page for BO.
    - Confirm client-side phone number validation.
    - Verify button click calls `sendDirectFeedbackSms` action.

- **4. Server Action for BO to Send Direct Feedback SMS (`sendDirectFeedbackSms`)**

  - **4.1. Task:** Create a server action for Business Owners to send (simulated) SMS invitations.
  - **4.2. Detailed Steps & Considerations:**
    - **File to Modify/Create:** `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\lib\actions\sms.actions.js` (add new action or ensure distinct from `requestSurveyLinkViaSms`).
    - **Function: `async function sendDirectFeedbackSms({ surveyId, phoneNumber })`**
      - **Authentication & Authorization:**
        - Use `auth()` from `lib/auth.js`. Verify `session.user` is an active `BUSINESS_OWNER`.
        - Verify the `surveyId` belongs to the authenticated BO.
      - **Input Validation (Zod):** Schema for `surveyId`, `phoneNumber`.
      - **Create `ResponseEntity` (Prisma):**
        - `surveyId`: from input.
        - `type`: `'DIRECT_SMS'` (to distinguish from QR-initiated).
        - `status`: `'PENDING'`.
        - `phoneNumber`: (Optional storage, consider privacy).
      - **Generate Unique Feedback URL:** `const uniqueUrl = \`\${process.env.NEXTAUTH_URL}/feedback/\${newResponseEntity.id}\`;`
      - **Call Simulated SMS Helper:** `await sendSms(validatedPhoneNumber, \`Message from BO for survey \${survey.name}: \${uniqueUrl}\`);`
      - **Return Value:** `{ success: true, message: 'SMS (simulated) sent.' }` or error.
    - **Best Practices:** Next.js Server Actions, Clean Code, Error Handling.
  - **4.3. Check Instructions (Server Action `sendDirectFeedbackSms`):**
    - When triggered from BO UI:
      - A new `ResponseEntity` (type `DIRECT_SMS`, status `PENDING`) is created.
      - Server console logs simulated SMS with correct details.
      - BO UI shows success toast.

- **5. Unique Public Feedback Page (`/feedback/[responseEntityId]`)**

  - **5.1. Task:** Ensure this dynamic public page correctly displays the survey for a given `responseEntityId` and handles already completed submissions. (This page structure should largely exist from Phase 4's original plan for unique links, but now it's the central point for all SMS-delivered links).
  - **5.2. Detailed Steps & Considerations:**
    - **File:** `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(public)\feedback\[responseEntityId]\page.jsx`
    - **Data Fetching (Server Component):**
      - `async function Page({ params })`. Extract `responseEntityId`.
      - Fetch `ResponseEntity` via Prisma, `include: { survey: { include: { questions: ... } } }`.
      - **Status Check & Error Handling:**
        - If `!responseEntity` or `!responseEntity.survey`, show "Link invalid or survey not found."
        - If `responseEntity.status === 'COMPLETED'`, show "Feedback already submitted for this link." and do NOT render the form.
    - **UI Rendering:**
      - If valid and `PENDING`, pass `responseEntity.survey` and `responseEntity.id` (as `responseEntityId`) to `SurveyDisplayForm`.
    - **Best Practices:** Next.js Rendering, UX for link states.
    - **Reusable Assets:** `SurveyDisplayForm`.
  - **5.3. Check Instructions (Unique Feedback Page):**
    - Generate an invite (either via BO UI or QR opt-in).
    - Access the unique URL from the (simulated) SMS.
    - If `ResponseEntity` is `PENDING`, verify survey loads via `SurveyDisplayForm`.
    - After submitting feedback (step 6), re-access URL. Verify "Feedback already submitted" message.
    - Test with an invalid `responseEntityId`. Verify "Link invalid" message.

- **6. Updated Feedback Submission Logic (Handled by Pre-Phase 5 Refactoring)**

  - **6.1. Task:** Ensure the `submitFeedback` server action correctly handles submissions originating from these unique links, using the `responseEntityId`.
  - **6.2. Summary of Changes (from Pre-Phase 5 Refactoring):**
    - `lib/actions/feedback.actions.js` (`submitFeedback`):
      - Now _requires_ `responseEntityId`.
      - Fetches `ResponseEntity` by `responseEntityId`.
      - Verifies `status === 'PENDING'`.
      - Creates `Response` records linked to this `responseEntityId`.
      - Atomically updates `ResponseEntity` status to `COMPLETED`.
      - No longer creates 'QR' type `ResponseEntity` records itself.
    - `components/features/feedback/survey-display-form.jsx`:
      - Receives `responseEntityId` as a prop.
      - Passes `responseEntityId` to `submitFeedback`.
  - **6.3. Check Instructions (Feedback Submission via Unique Link):**
    - Submit feedback via a unique link (from either BO invite or QR opt-in).
    - Verify consumer UI success toast.
    - DB: `ResponseEntity` status `COMPLETED`, `submittedAt` populated. `Response` records linked.
    - Attempt re-submission via the same link. Verify it's blocked by the `/feedback/[responseEntityId]/page.jsx` logic and/or the `submitFeedback` action's pre-submission check.

- **7. BO Viewing & Tracking of All SMS-Initiated Responses**

  - **7.1. Task:** Update the BO's survey details page to display all responses submitted via unique links (both `DIRECT_SMS` and `QR_INITIATED_SMS`) and provide a tracking list for all SMS invitations/requests.
  - **7.2. Detailed Steps & Considerations:**
    - **Files to Modify:**
      - `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(bo)\surveys\[surveyId]\page.jsx` (Server Component for data fetching)
      - `d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\components\features\surveys\survey-details-client.jsx` (Client Component for UI rendering)
    - **Data Fetching (in `page.jsx`):**
      - Modify Prisma query to fetch all `ResponseEntity` records for the `surveyId`, including types `DIRECT_SMS` and `QR_INITIATED_SMS`.
      - Include related `responses` for display.
      - Example: `include: { responseEntities: { include: { responses: { include: { question: true } } }, orderBy: { createdAt: 'desc' } } }`
    - **UI Updates (in `survey-details-client.jsx`):**
      - **Consolidated Response Display:**
        - The existing `ResponseViewer` component should already be capable of displaying responses based on `ResponseEntity` data. Ensure it clearly shows the `responseEntity.type` (e.g., "SMS Invite", "QR Scan SMS") using the Badge component.
      - **SMS Invitation/Request Tracking List:**
        - Add a new section/tab, e.g., "SMS Log" or "Link Invitations".
        - Use Shadcn `Table` to display all `ResponseEntity` records where `type` is `DIRECT_SMS` or `QR_INITIATED_SMS`.
        - Columns: "Type" (`DIRECT_SMS`/`QR_INITIATED_SMS`), "Sent To" (phone number, if stored and displayable), "Sent At" (`ResponseEntity.createdAt`), "Status" (`ResponseEntity.status`), "Submitted At".
    - **Best Practices:** Efficient data flow, Clear UI for BO.
  - **7.3. Check Instructions (BO Viewing & Tracking):**
    - Log in as BO, navigate to survey details.
    - Verify responses submitted via both direct SMS invites and QR-initiated SMS links are displayed in the `ResponseViewer`, with their origin type clear.
    - Verify the "SMS Log" table accurately lists all `DIRECT_SMS` and `QR_INITIATED_SMS` `ResponseEntity` records with correct status and timestamps.
    - Confirm status updates in the log as feedback is submitted.

- **3. Check Instructions (Detailed):**

  - Log in as BO, send SMS. Verify BO toast. Verify DB `ResponseEntity` (type SMS).
  - _(Simulate)_ Open unique URL `/feedback/[responseEntityId]`. Verify survey loads.
  - **QR Flow Test:**
    - Access `/s/[surveyId]`. Enter phone. Verify (simulated) SMS log & DB `ResponseEntity` (type `QR_INITIATED_SMS`, status `PENDING`).
    - Open unique link. Submit feedback. Verify DB updates.
  - **BO Direct SMS Flow Test:**
    - Log in as BO, go to survey details, use "Send SMS Invite" UI. Enter phone. Verify BO toast, (simulated) SMS log & DB `ResponseEntity` (type `DIRECT_SMS`, status `PENDING`).
    - Open unique link from this invite. Submit feedback. Verify DB updates.
  - **Common Checks for Both Flows:**
    - Verify consumer success toast on feedback submission.
    - Verify `ResponseEntity` status updates to `COMPLETED` and `submittedAt` is populated.
    - Verify `Response` records are correctly created and associated.
    - Attempt to re-use a unique link after submission. Verify "Feedback already submitted" message and no form.
  - **BO Dashboard Verification:** - Log in as BO, view survey details. - Verify responses from both flows are displayed in `ResponseViewer`, with type indicated. - Verify the "SMS Log" table shows entries for both `QR_INITIATED_SMS` and `DIRECT_SMS`, with correct status ("PENDING" then "COMPLETED").

**Phase 6: Incentive Mechanism (SMS) (Updated)**

**Objective:** To implement an incentive system where users who submit feedback via SMS receive a discount code, and Business Owners can manage and redeem these codes.

### 1. Database Schema Updates (`prisma/schema.prisma`)

**Tasks:**

- **1.1. Define `DiscountCode` Model:**

  - Create a new Prisma model named `DiscountCode`.
  - **Fields:**
    - `id`: String (UUID, primary key, default `cuid()`)
    - `code`: String (unique, alphanumeric, e.g., `SAVE10NOW`) - This will be the actual discount code.
    - `discountType`: Enum (e.g., `PERCENTAGE`, `FIXED_AMOUNT`) - To specify the type of discount.
    - `discountValue`: Float - The value of the discount (e.g., 10 for 10% or 5 for $5).
    - `isRedeemed`: Boolean (default `false`) - Tracks if the code has been used.
    - `redeemedAt`: DateTime (optional) - Timestamp of when the code was redeemed.
    - `expiresAt`: DateTime (optional) - Expiry date for the discount code.
    - `createdAt`: DateTime (default `now()`)
    - `updatedAt`: DateTime (`updatedAt`)
    - `responseEntityId`: String (unique, optional) - Foreign key linking to the `ResponseEntity` that triggered this code. This creates a one-to-one relationship.
    - `responseEntity`: Relation to `ResponseEntity` (fields: `[responseEntityId]`, references: `[id]`)
    - `businessId`: String - Foreign key linking to the `Business` model (assuming a `Business` model exists or will be created for BOs).
    - `business`: Relation to `Business` (fields: `[businessId]`, references: `[id]`)
  - **Best Practices:**
    - **Data Integrity:** Using unique constraints for `code` and `responseEntityId` ensures data consistency.
    - **Scalability:** Indexed fields (`code`, `responseEntityId`, `businessId`) will be important for query performance as the number of codes grows.
    - **Clarity:** Clear field names and types.

- **1.2. Update `ResponseEntity` Model:**

  - Add an optional relation field to link to the `DiscountCode`.
  - **Fields (Addition):**
    - `discountCode`: Relation (optional, one-to-one) to `DiscountCode` model.
  - **Rationale:** This allows easy traversal from a `ResponseEntity` to its associated `DiscountCode`.

- **1.3. Create and Apply Migration:**
  - Generate migration files: `npx prisma migrate dev --name add_incentive_discount_codes`
  - Apply the migration to the database.
  - **Best Practices:**
    - **Version Control:** Migrations are version-controlled, making schema changes trackable and reversible.
    - **CLI Usage:** Utilizing Prisma CLI for schema migrations is a standard and reliable practice.

### 2. Backend Development (Server Actions & Logic)

**Location:** `lib/actions/incentives.actions.js` (new file), `lib/actions/feedback.actions.js` (updates)

**Tasks:**

- **2.1. Discount Code Generation Service/Utility:**

  - **File:** `lib/utils/generateDiscountCode.js` (new file)
  - **Functionality:** Create a function `generateUniqueDiscountCode(length, prefix)` that generates a cryptographically strong, unique, and human-readable (if possible) discount code string.
    - Consider using a library like `nanoid` for robust unique ID generation if simple random strings are not sufficient, or implement custom logic to ensure uniqueness against existing codes in the DB.
  - **Best Practices:**
    - **Modularity & Reusability:** A dedicated utility function promotes DRY.
    - **Security:** Ensure codes are not easily guessable if they provide significant value.

- **2.2. Server Action: `generateAndAssignDiscountCode`**

  - **File:** `lib/actions/incentives.actions.js`
  - **Functionality:**
    - To be called internally after a successful SMS feedback submission that qualifies for an incentive.
    - Input: `responseEntityId`, `businessId`, `discountType`, `discountValue`, `expiresAt` (optional).
    - Logic:
      1.  Verify `ResponseEntity` exists and is `COMPLETED`.
      2.  Check if a discount code already exists for this `responseEntityId` to prevent duplicates.
      3.  Generate a unique discount code using the utility from 2.1.
      4.  Create a new `DiscountCode` record in the database, linking it to the `responseEntityId` and `businessId`.
      5.  Return the created `DiscountCode` object.
  - **Best Practices:**
    - **Separation of Concerns:** This action handles only discount code creation logic.
    - **Transactional Integrity (Consideration):** If multiple DB operations are involved and atomicity is critical, consider Prisma transactions. For this specific action, creating a single `DiscountCode` record might not strictly require a transaction unless combined with other updates that must succeed or fail together.
    - **Next.js Data Fetching:** This is a server action, aligning with Next.js patterns for mutations.

- **2.3. Server Action: `getDiscountCodesForBusiness`**

  - **File:** `lib/actions/incentives.actions.js`
  - **Functionality:**
    - Input: `businessId`, pagination parameters (optional: `page`, `limit`), filter parameters (optional: `status` like 'redeemed', 'active', 'expired').
    - Logic: Fetch a list of `DiscountCode` records associated with the given `businessId`. Include related `ResponseEntity` data if useful (e.g., submission timestamp).
    - Implement proper authorization to ensure only the authenticated BO can access their codes.
  - **Best Practices:**
    - **Scalability:** Implement pagination for potentially large lists of codes.
    - **Performance:** Select only necessary fields from the database.
    - **Security:** Robust authorization checks are critical.

- **2.4. Server Action: `redeemDiscountCode`**

  - **File:** `lib/actions/incentives.actions.js`
  - **Functionality:**
    - Input: `code` (the discount code string), `businessId`.
    - Logic:
      1.  Find the `DiscountCode` by its `code` and `businessId`.
      2.  Verify the code exists, belongs to the BO, is not already redeemed, and is not expired.
      3.  If valid, mark `isRedeemed` as `true` and set `redeemedAt` timestamp.
      4.  Return success/failure status and the updated `DiscountCode` object or an error message.
  - **Best Practices:**
    - **Idempotency (Consideration):** Ensure that redeeming an already redeemed code (if attempted again) results in a clear status rather than an error or re-processing, though the primary check should prevent this.
    - **Error Handling:** Provide clear reasons for redemption failure (e.g., "Code not found", "Code already redeemed", "Code expired"). (Note: UI for these errors is deferred, but the action should return appropriate data).

- **2.5. Update `submitFeedback` Server Action:**
  - **File:** `lib/actions/feedback.actions.js`
  - **Modification:**
    - After successfully marking `ResponseEntity` as `COMPLETED` (as per Phase 5).
    - If the `ResponseEntity.type` is "DIRECT_SMS" or "QR_INITIATED_SMS" (or any other type designated for incentives):
      - Call the `generateAndAssignDiscountCode` action (from 2.2).
      - The `businessId` can be retrieved from the `ResponseEntity`'s associated `Survey`'s `userId` (assuming `Survey` has a `userId` that maps to a `Business` or `User` who owns the business). This needs to be traced back. If `ResponseEntity` doesn't directly link to `Business` or `Survey` doesn't link to `Business`, this link needs to be established or passed through.
      - Store the generated discount code details (or just the code itself) to be returned to the client for display.
  - **Best Practices:**
    - **Modularity:** Calling another specialized action keeps `submitFeedback` focused.
    - **Data Flow:** Ensure necessary data (like `businessId`, discount parameters) is available or derivable.

### 3. Frontend Development - User Facing (Feedback Submitter)

**Tasks:**

- **3.1. Display Discount Code after Feedback Submission:**
  - **File to Update:** `app/(public)/feedback/[responseEntityId]/page.jsx` (or the component that handles the post-submission UI).
  - **Functionality:**
    - When the `submitFeedback` server action (from `lib/actions/feedback.actions.js`) returns successfully and includes discount code information:
      - Display the discount code clearly to the user.
      - Show any relevant details like discount value, type, and expiry date (if applicable).
  - **Component:** Create a new component `components/features/feedback/discount-code-display.jsx`.
    - Props: `code`, `discountValue`, `discountType`, `expiresAt`.
    - Displays the information in a user-friendly way.
  - **Best Practices:**
    - **UI/UX:** Make the code prominent and easy to copy. Provide clear instructions if any.
    - **Component Reusability:** The `DiscountCodeDisplay` component can be styled once and used.
    - **Clean Code:** Separate presentation logic into this new component.
    - **Shadcn UI/Tailwind:** Use existing UI primitives for styling (e.g., Card, Typography, Badges for expiry).

### 4. Frontend Development - Business Owner (BO) Dashboard

**Location:** `app/(dashboard)/incentives/page.jsx` (new route/page), `components/features/dashboard/incentives/` (new directory for components).

**Tasks:**

- **4.1. New Dashboard Page/Section: "Incentives" or "Discount Codes"**

  - **File:** `app/(dashboard)/incentives/page.jsx`
  - **Functionality:**
    - Create a new route and page within the BO dashboard.
    - This page will host components for viewing and redeeming discount codes.
  - **Best Practices:**
    - **Next.js Routing:** Use App Router conventions for the new page.
    - **Project Structure:** Organize incentive-related dashboard components under `components/features/dashboard/incentives/`.

- **4.2. Component: `DiscountCodeManagementTable.jsx`**

  - **File:** `components/features/dashboard/incentives/discount-code-management-table.jsx`
  - **Functionality:**
    - Fetch and display a list of discount codes for the authenticated BO using the `getDiscountCodesForBusiness` server action.
    - Display columns: Code, Discount Type, Discount Value, Status (Active/Redeemed/Expired), Generated At, Redeemed At, Expires At.
    - Implement client-side pagination and filtering (if server action supports it) to interact with the data.
    - Consider reusing or adapting table components if a generic table solution already exists (e.g., from Shadcn UI's Table component).
  - **Best Practices:**
    - **Component Reusability:** Leverage existing table components/styles.
    - **Data Fetching (Next.js):** Use `useEffect` and client-side fetching for interactivity, or server components with revalidation for simpler lists. Given the need for pagination/filters, client-side fetching with server actions is common.
    - **UI/UX:** Clear presentation of data, easy-to-understand statuses.
    - **Shadcn UI/Tailwind:** Style according to project conventions.

- **4.3. Component: `RedeemDiscountCodeForm.jsx`**
  - **File:** `components/features/dashboard/incentives/redeem-discount-code-form.jsx`
  - **Functionality:**
    - A simple form with an input field for the BO to enter a discount code.
    - A "Redeem" button that calls the `redeemDiscountCode` server action.
    - Display success or error messages returned from the server action (e.g., "Code redeemed successfully", "Invalid or expired code"). (UI for messages, not full error pages).
    - Upon successful redemption, the `DiscountCodeManagementTable` should ideally refresh or update to reflect the change in status. This can be achieved through state management or re-fetching.
  - **Best Practices:**
    - **User Experience:** Provide immediate feedback on the redemption attempt.
    - **Forms:** Use React Hook Form or a similar library if forms are complex, or simple controlled components for this straightforward case. Leverage Shadcn UI's Form components.
    - **Clean Code:** Separate form logic and presentation.

### 5. Integration & Workflow Updates

**Tasks:**

- **5.1. Update Feedback Submission Flow:**

  - Ensure the `submitFeedback` action in `lib/actions/feedback.actions.js` correctly calls the discount generation logic and returns the code to the frontend.
  - The frontend page `app/(public)/feedback/[responseEntityId]/page.jsx` needs to handle the new response from `submitFeedback` to display the discount code.

- **5.2. Business Owner Authentication & Authorization:**
  - All server actions related to incentives (`getDiscountCodesForBusiness`, `redeemDiscountCode`) must robustly check that the calling user is an authenticated BO and is authorized to perform the action on the specified resources (e.g., can only redeem codes for their own business).
  - This likely leverages existing authentication mechanisms.

### 6. Testing Considerations (Manual & Automated if applicable)

- **Discount Code Generation:**
  - Verify codes are generated upon SMS feedback submission.
  - Verify code uniqueness.
  - Verify correct association with `ResponseEntity` and `Business`.
- **User Experience (Feedback Submitter):**
  - Test if the discount code is displayed correctly after feedback submission.
  - Test various discount types/values display.
- **BO Dashboard - Code Listing:**
  - Test if codes are listed correctly for the logged-in BO.
  - Test pagination and filtering (if implemented).
  - Test status updates (e.g., a redeemed code shows as "Redeemed").
- **BO Dashboard - Code Redemption:**
  - Test redeeming a valid, active code.
  - Test attempting to redeem an already redeemed code.
  - Test attempting to redeem an expired code.
  - Test attempting to redeem a non-existent code.
  - Test attempting to redeem a code belonging to another business (authorization failure).
- **Edge Cases:**
  - What happens if discount code generation fails for some reason after feedback is submitted? (The plan defers full error handling UI, but the backend logic should be robust).

### 7. Codebase Impact & Reusability

- **New Files/Modules:**

  - `prisma/schema.prisma` (updated)
  - `lib/actions/incentives.actions.js`
  - `lib/utils/generateDiscountCode.js`
  - `app/(dashboard)/incentives/page.jsx`
  - `components/features/feedback/discount-code-display.jsx`
  - `components/features/dashboard/incentives/discount-code-management-table.jsx`
  - `components/features/dashboard/incentives/redeem-discount-code-form.jsx`

- **Modified Files/Modules:**

  - `lib/actions/feedback.actions.js` (to integrate discount code generation)
  - `app/(public)/feedback/[responseEntityId]/page.jsx` (to display discount code)
  - Potentially `components/features/feedback/survey-display-form.jsx` if it handles the post-submission UI state that then shows the discount code. (Based on Phase 5, `app/(public)/feedback/[responseEntityId]/page.jsx` seems more likely for post-submission display).

- **Reusable Assets Leveraged (from existing codebase as per Phase 1 & 5 summaries):**

  - **UI Primitives (Shadcn UI/Tailwind):** Buttons, Inputs, Cards, Tables, Typography will be used extensively.
  - **Container Component:** For page layout consistency in the new dashboard section.
  - **Server Action Patterns:** Established in Phase 5 (`lib/actions/sms.actions.js`, `lib/actions/feedback.actions.js`) will be followed for `incentives.actions.js`.
  - **Prisma Client & Setup:** Existing Prisma setup will be used for database interactions.
  - **Authentication System:** Assumed to be in place for BO dashboard access.
  - **Directory Structure:** Adherence to `components/features/...` and `app/...` conventions.

- **Redundancies:**

  - None anticipated with this new feature addition.

- **Package Management (`package.json`):**
  - **Existing Packages to Leverage:**
    - `prisma`, `@prisma/client`: For database interaction.
    - `next`, `react`, `react-dom`: Core framework.
    - `tailwindcss`, `lucide-react`, `shadcn-ui` related packages (e.g., `class-variance-authority`, `clsx`, `tailwind-merge`): For UI and styling.
  - **New Packages Required (Consideration):**
    - `nanoid` (optional): For generating more robust unique IDs for discount codes if the custom utility `generateUniqueDiscountCode.js` needs stronger guarantees than `Math.random()` based approaches.
      - **Justification:** `nanoid` is small, fast, secure, and URL-friendly, good for unique identifiers.
      - **CLI:** `npm install nanoid` or `yarn add nanoid`.

### 8. Deferred Development (Reminder)

- Detailed page loading states (spinners, skeletons beyond basic component readiness).
- Comprehensive error handling components (error boundaries, dedicated error UIs). Server actions should return error _information_, but specific UI components to display these in a standardized way across the app are deferred.

This plan provides a detailed roadmap for implementing the incentive mechanism in Phase 6. Remember to apply clean code principles, ensure modularity, and maintain consistency with the established project architecture and UI conventions throughout the development process.

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
