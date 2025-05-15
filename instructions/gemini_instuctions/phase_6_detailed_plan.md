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
