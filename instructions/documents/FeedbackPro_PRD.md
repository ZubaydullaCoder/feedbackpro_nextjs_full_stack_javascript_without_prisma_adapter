# PRD: FeedbackPro V1.0

---

**Product Requirements Document (PRD): FeedbackPro V1.0**

**(As of: Tuesday, April 15, 2025)**

**1. Introduction**

- **Purpose:** This document outlines the requirements for the initial version (V1.0) of FeedbackPro. The platform aims to provide businesses with simple and effective tools (SMS, QR Codes) to collect **impartial and tamper-proof** customer feedback, enabling them to identify areas for service improvement. It also includes a mechanism to incentivize feedback via SMS and provides administrative oversight for the platform itself.
- **Problem:** Businesses, especially SMBs, need timely, honest customer feedback but often lack accessible tools. Ensuring feedback integrity and encouraging customer participation are also significant challenges. Traditional methods might be complex, have low response rates, or allow feedback to be filtered or altered.
- **Solution:** A web application where businesses can create simple surveys, distribute them via unique SMS links or scannable QR codes, track basic interactions, and analyze response data. Feedback submitted via unique links is treated as immutable by the business user to ensure integrity. Customers responding via SMS are rewarded with a simple, redeemable discount code. A platform administrator role ensures smooth operation and user management.
- **Target Audience:**
  - Primary: Small to Medium Business (SMB) owners or managers (e.g., cafes, restaurants, salons, repair shops).
  - Secondary: Consumers of these businesses.
  - Tertiary: Platform Administrator(s).

**2. Goals**

- **For Business Owners (V1.0):**
  - Provide a simple, secure registration and login process.
  - Enable easy creation and management of basic feedback surveys.
  - Allow feedback collection via:
    - Manually triggered SMS messages with unique, single-use links.
    - Generating generic QR codes linked to surveys for display.
  - Provide a clear overview of sent SMS messages (status: Sent, Completed).
  - Offer basic analytics on survey responses (response rate for SMS, total QR responses, average ratings), ensuring submitted feedback **cannot be altered** by the business owner.
  - Provide a simple mechanism to _verify_ discount codes presented by customers (earned via SMS feedback).
- **For Consumers (V1.0):**
  - Provide a frictionless way to access surveys via SMS link or QR code scan.
  - Ensure a fast, mobile-friendly survey-taking experience (no login required).
  - Receive a simple reward (e.g., a unique discount code) upon successful completion of a survey accessed via an **SMS link**.
  - Trust that their feedback submitted via the unique SMS link is **impartial** and cannot be tampered with.
- **For Platform Administrators (V1.0):**
  - Provide secure access to a dedicated admin interface.
  - Enable management (view, activate, deactivate, delete) of Business Owner accounts.
  - Provide oversight of basic platform usage metrics.
  - Manage essential system configurations (e.g., SMS gateway settings - potentially view-only or basic edits in V1).
- **Overall Business Goal (V1.0):**
  - Validate the core feedback loop (SMS & QR methods) emphasizing **feedback integrity**.
  - Test the effectiveness of the SMS incentive mechanism (discount code).
  - Ensure platform stability, security, and manageability.
  - Gather initial user feedback on the platform itself.

**3. User Personas**

- **Bekzod (Business Owner):**
  - _Role:_ Owner of a local restaurant.
  - _Needs:_ Wants honest, direct feedback on food quality and service speed immediately after a customer dines. Needs to trust the feedback isn't filtered. Wants an easy way to collect it and occasionally reward customers.
  - _Frustrations:_ Review sites can be biased or infrequent. Doesn't have time for complex tools. Worries staff might discourage negative feedback.
  - _Goal:_ Use FeedbackPro to send SMS surveys, display QR codes on tables, view untampered feedback scores/comments, and verify discount codes earned by customers.
- **Nodira (Consumer):**
  - _Role:_ Frequent diner at local restaurants.
  - _Needs:_ Willing to give quick feedback if easy, especially if incentivized (like a discount) or after a notable experience. Values anonymity/impartiality.
  - _Frustrations:_ Long surveys, required logins,担心 feedback being ignored or manipulated.
  - _Context:_ Receives an SMS after dining at Bekzod's or scans a QR code on the table.
  - _Goal:_ Quickly answer a few questions via the link. If via SMS, receive and note the discount code for her next visit.
- **Admin (Platform Administrator):**
  - _Role:_ Platform operator/support staff.
  - _Needs:_ Monitor platform health, manage business signups, handle support requests related to accounts, ensure system integrity.
  - _Goal:_ Keep the platform running smoothly, manage the user base, view overall usage trends.

**4. Features / User Stories (V1.0)**

**4.1. Business Owner Features**

- **Authentication:**
  - `BO-AUTH-01`: As a BO, I want to register securely (e.g., email/password), so I can access the platform.
  - `BO-AUTH-02`: As a BO, I want to log in securely, so I can manage my surveys and view feedback.
  - `BO-AUTH-03`: As a BO, I want a password reset mechanism, so I can regain access if forgotten.
- **Dashboard:**
  - `BO-DASH-01`: As a BO, I want a simple dashboard overview after login (e.g., # surveys, recent activity links), so I can quickly navigate.
- **Survey Management:**
  - `BO-SURV-01`: As a BO, I want to create a new survey with a name, so I can organize feedback campaigns.
  - `BO-SURV-02`: As a BO, I want to add basic questions (e.g., 1-5 Rating, Yes/No, Short Text) to my survey, so I can collect relevant feedback.
  - `BO-SURV-03`: As a BO, I want to view a list of my created surveys, so I can manage them.
  - `BO-SURV-04`: As a BO, I want to preview how a survey looks to the consumer, so I ensure clarity.
  - `BO-SURV-05`: As a BO, I want to generate a printable QR code image for a survey, so I can display it physically.
- **Feedback Collection & Tracking:**
  - `BO-SMS-01`: As a BO, I want to select a survey and manually enter a customer's phone number to send a **unique, single-use feedback link** via SMS, so I can request feedback for a specific interaction.
  - `BO-SMS-02`: As a BO, I want to view a list of SMS messages sent for a survey (masked number, date, status: Sent/Completed), so I can track outreach.
  - `BO-QR-01`: As a BO, I want visibility into QR code usage (e.g., total responses via QR for a survey), so I know if it's effective.
- **Analytics & Responses:**
  - `BO-ANAL-01`: As a BO, I want to view individual survey responses (both SMS and QR), knowing this data is **read-only** for me, ensuring its integrity.
  - `BO-ANAL-02`: As a BO, I want to see basic aggregated analytics (SMS response rate, total QR responses, average rating scores), so I can understand trends.
- **Incentive Management:**
  - `BO-INCN-01`: As a BO, I need a simple way to input and verify a discount code presented by a customer, so I can confirm it's valid (Issued/Not Redeemed) before applying a discount.
  - `BO-INCN-02`: As a BO, after verifying a valid code, I need to mark it as Redeemed, so it cannot be used again.

**4.2. Consumer Features**

- **Survey Interaction (General):**
  - `CUST-SURV-01`: As a Consumer, I want to easily access a survey form via a link (from SMS) or QR code scan.
  - `CUST-SURV-02`: As a Consumer, I want the survey form to load quickly and be easy to use on my mobile device, without requiring login.
  - `CUST-SURV-03`: As a Consumer, I want to answer the questions easily (tapping/typing).
  - `CUST-SURV-04`: As a Consumer, I want clear confirmation after submitting my feedback.
- **Survey Interaction (SMS Specific):**
  - `CUST-SMS-01`: As a Consumer, I understand the SMS link is unique to my interaction, ensuring my feedback is tied correctly and cannot be submitted by others using my link.
  - `CUST-INCN-01`: As a Consumer, after submitting feedback via an SMS link, I want to be clearly shown a unique discount code and redemption instructions, so I get my reward.

**4.3. Platform Administrator Features**

- **Authentication:**
  - `ADM-AUTH-01`: As an Admin, I need secure login access distinct from Business Owners.
- **User Management (Business Owners):**
  - `ADM-USER-01`: As an Admin, I want to view a list of all registered Business Owner accounts (email, name, status).
  - `ADM-USER-02`: As an Admin, I want to activate/deactivate Business Owner accounts.
  - `ADM-USER-03`: As an Admin, I want to delete Business Owner accounts (and associated data - needs clear definition).
- **Platform Oversight:**
  - `ADM-OVER-01`: As an Admin, I want to view high-level platform statistics (e.g., total businesses, total surveys, total responses).
- **System Configuration:**
  - `ADM-CONF-01`: As an Admin, I need to manage (view/update securely) essential system settings like SMS gateway credentials.

**5. Design & UX Considerations**

- **Business Owner:** Clean, intuitive interface. Prioritize ease of survey creation, sending/generating links, and viewing results. Data visualization should be clear.
- **Consumer:** Mobile-first, extremely simple, fast-loading survey form. Minimal friction is key. Clear indication of reward (for SMS).
- **Administrator:** Functional, secure interface. Clarity over aesthetics for V1.
- **General:** Consistent UI language and components (leveraging Shadcn UI).

**6. Release Criteria (MVP V1.0)**

- All defined V1.0 User Stories implemented and manually tested.
- Core feedback loop functional (Create Survey -> Send SMS / Generate QR -> Collect Response -> View Response/Basic Stats).
- Feedback integrity maintained (BO cannot alter submitted responses).
- SMS incentive mechanism functional (code display on SMS completion, basic BO verification/redemption).
- Admin role functional (BO user management, basic stats view).
- Secure authentication for BOs and Admins.
- Integration with SMS Gateway working reliably.
- Basic data privacy measures addressed (terms/privacy policy placeholders).

**7. Non-Functional Requirements**

- **Performance:** Fast loading times, especially for the consumer survey form (<2s). Responsive dashboard for BOs.
- **Scalability:** V1 architecture should support moderate initial load (e.g., dozens of businesses, hundreds of SMS/month).
- **Reliability:** High uptime for the application. Reliable SMS delivery (dependent on provider).
- **Security:** Secure authentication (password hashing), authorization (role checks), protection against common web vulnerabilities (XSS, CSRF - handled by framework where possible), HTTPS. Data privacy considerations.
- **Integrity:** Submitted feedback data (especially via unique SMS links) must be immutable from the Business Owner's perspective. Actions, especially admin actions, should be logged where appropriate (post-V1).
- **Usability:** High priority for all user types. Simple, intuitive workflows.
- **Compliance:** Adherence to relevant regulations in Uzbekistan regarding data privacy, SMS communications, and consumer rights.

**8. Future Considerations (Post V1.0)**

- Advanced analytics (filtering, trends, sentiment analysis).
- More survey question types and logic.
- Bulk SMS sending / Customer list import.
- API for integration (e.g., trigger SMS from POS).
- Business branding options.
- User roles within a Business account.
- Full credit accumulation system for consumers.
- Multi-language support.
- Automated testing suite.
- Enhanced admin reporting and configuration.

**9. Open Questions**

- Specific SMS Gateway provider choice for Uzbekistan? Cost/reliability?
- Exact mechanism for BO discount code verification/redemption in V1 UI?
- Precise level of data visibility/manipulation for Admin role (especially regarding responses/phone numbers)? Define strict limits.
- Detailed compliance requirements check for Uzbekistan (SMS consent, data retention).
- Initial limits (if any) on surveys/SMS per BO for V1?
- Default language for surveys? Option for BO to choose?

---

This PRD reflects the latest understanding of the FeedbackPro V1 requirements, focusing on functionality and user value while acknowledging the technical foundation decided upon (Full-Stack Next.js).
