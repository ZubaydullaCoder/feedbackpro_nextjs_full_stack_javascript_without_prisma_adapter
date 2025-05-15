# Plan to Address Post-Phase 4 Implementation Issues

This document outlines the plan to resolve issues identified after the initial implementation of Phase 4 ("Core Feedback Submission & Viewing").

**Targeted Issues:**

1.  Business Owners (BOs) can submit feedback to their own surveys.
2.  The `RadioGroup` component in the survey display form (`components/features/feedback/survey-display-form.jsx`) is not functioning correctly (e.g., allowing multiple selections or not registering selections).
3.  Consumers can submit feedback multiple times for the same survey via a QR code link.

---

## Issue 1: Prevent Business Owner Self-Submission

**Goal:** If a logged-in Business Owner visits the public link for one of their own surveys, they should see a message indicating they cannot submit feedback, instead of the survey form.

**Strategy:**
On the server-side rendering of the public survey page (`app/(public)/s/[surveyId]/page.jsx`), check if there's an active session. If the session belongs to a `BUSINESS_OWNER`, compare their ID with the ID of the user who owns the survey's business.

**Affected File:** [`app/(public)/s/[surveyId]/page.jsx`](<app/(public)/s/[surveyId]/page.jsx>)

**Detailed Steps:**

1.  **Import `auth` helper:**

    ```javascript
    // At the top of app/(public)/s/[surveyId]/page.jsx
    import { auth } from "@/auth"; // Assuming auth.js is at the root
    ```

2.  **Fetch Session and Survey Owner Information:**

    - Inside the `PublicSurveyPage` component, before returning JSX, get the current session.
    - When fetching the survey, ensure you also get the `userId` associated with the `business`.

    ```javascript
    // Inside PublicSurveyPage function in app/(public)/s/[surveyId]/page.jsx
    export default async function PublicSurveyPage({ params }) {
      const session = await auth(); // Get current session

      const survey = await prisma.survey.findUnique({
        where: {
          id: params.surveyId,
          status: "ACTIVE",
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          business: {
            // Ensure business and its user are included
            select: {
              name: true,
              userId: true, // Crucial for ownership check
            },
          },
        },
      });

      if (!survey) {
        notFound();
      }

      let isOwner = false;
      if (
        session?.user?.id &&
        session.user.role === "BUSINESS_OWNER" &&
        survey.business?.userId === session.user.id
      ) {
        isOwner = true;
      }

      // ... rest of the component (header, main, footer structure)
      // The conditional rendering will happen inside the main content area
    }
    ```

3.  **Conditionally Render Form or Message:**

    - Based on the `isOwner` flag, either render the `SurveyDisplayForm` or a message within the main content area of the page.

    ```javascript
    // Inside the return statement of PublicSurveyPage, within the <main> section where the form is currently rendered:
    // Replace the existing <SurveyDisplayForm survey={survey} /> block with this conditional logic:
    {
      isOwner ? (
        <div className="text-center py-8 px-4 rounded-md bg-yellow-50 border border-yellow-200">
          <h2 className="text-xl font-semibold text-yellow-700">
            Survey Notice
          </h2>
          <p className="text-yellow-600 mt-2">
            You are viewing your own survey. As the owner, you cannot submit
            feedback.
          </p>
          <p className="text-sm text-yellow-500 mt-1">
            To test the survey, please open this link in an incognito window or
            a different browser where you are not logged in.
          </p>
        </div>
      ) : (
        <SurveyDisplayForm survey={survey} /> // survey object includes questions
      );
    }
    ```

---

## Issue 2: Fix RadioGroup Malfunction

**Goal:** Ensure `RadioGroup` components in the survey form function correctly, allowing only one selection and properly integrating with `react-hook-form`.

**Strategy:**
Modify how `react-hook-form`'s `field` props are passed to the Shadcn UI `RadioGroup` component within `components/features/feedback/survey-display-form.jsx`. Explicitly pass `value={field.value}` and `onValueChange={field.onChange}` to the `RadioGroup`.

**Affected File:** [`components/features/feedback/survey-display-form.jsx`](components/features/feedback/survey-display-form.jsx)

**Detailed Steps:**

1.  **Update `renderQuestionInput` for `RATING_SCALE_5` and `YES_NO` types:**

    ```javascript
    // In components/features/feedback/survey-display-form.jsx
    const renderQuestionInput = (question, field) => {
      switch (question.type) {
        case "TEXT":
          return (
            <Textarea
              placeholder="Enter your answer..."
              className="resize-none"
              {...field} // Spreading field props is generally fine for simple inputs
            />
          );
        case "RATING_SCALE_5":
          return (
            <RadioGroup
              className="flex gap-4"
              onValueChange={field.onChange} // Explicitly pass react-hook-form's onChange
              value={field.value} // Explicitly pass react-hook-form's value
              // name={field.name} // Consider adding if issues persist, for native form behavior
              // ref={field.ref}   // Consider adding if react-hook-form requires it for this component
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={value.toString()} // Ensure value is a string if RHF expects string
                    id={`rating_${question.id}_${value}`}
                  />
                  <label htmlFor={`rating_${question.id}_${value}`}>
                    {value}
                  </label>
                </div>
              ))}
            </RadioGroup>
          );
        case "YES_NO":
          return (
            <RadioGroup
              className="flex gap-4"
              onValueChange={field.onChange} // Explicitly pass react-hook-form's onChange
              value={field.value} // Explicitly pass react-hook-form's value
              // name={field.name}
              // ref={field.ref}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id={`yes_${question.id}`} />
                <label htmlFor={`yes_${question.id}`}>Yes</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id={`no_${question.id}`} />
                <label htmlFor={`no_${question.id}`}>No</label>
              </div>
            </RadioGroup>
          );
        default:
          return <Input placeholder="Enter your answer..." {...field} />;
      }
    };
    ```

    - **Note:** The key change is moving from spreading `...field` on the `RadioGroup` to explicitly assigning `onValueChange={field.onChange}` and `value={field.value}`. This often resolves integration issues with controlled components from UI libraries.

---

## Issue 3: Prevent Duplicate QR Submissions (Client-Side Deterrent)

**Goal:** Prevent a user from easily re-submitting a QR-code-linked survey from the same browser session/device. This is a deterrent, not a foolproof server-side prevention for anonymous QR links.

**Strategy:**
Use `localStorage` to set a flag when a survey is submitted. On form load, check for this flag. If present, display a "Thank You" or "Already Submitted" message instead of the form. Refactor the "Thank You" message display to use React state for cleaner conditional rendering.

**Affected File:** [`components/features/feedback/survey-display-form.jsx`](components/features/feedback/survey-display-form.jsx)

**Detailed Steps:**

1.  **Ensure `useEffect` is imported from React:**

    ```javascript
    // At the top of components/features/feedback/survey-display-form.jsx
    import { useState, useEffect } from "react"; // Make sure useEffect is imported
    ```

2.  **Add State for Submission Status:**

    ```javascript
    // Inside the SurveyDisplayForm component, before the form definition
    const [hasSubmitted, setHasSubmitted] = useState(false);
    ```

3.  **Check `localStorage` on Component Mount:**

    ```javascript
    // Inside SurveyDisplayForm component, after state declarations
    useEffect(() => {
      const submittedFlag = localStorage.getItem(
        `feedbackSubmitted_${survey.id}`
      );
      if (submittedFlag === "true") {
        setHasSubmitted(true);
      }
    }, [survey.id]); // Dependency array ensures this runs if survey.id changes (though unlikely for this form)
    ```

4.  **Update `onSubmit` Logic for Success Case:**

    - On successful submission, set the `localStorage` flag.
    - Update the `hasSubmitted` state to true to trigger re-render.
    - Remove the direct DOM manipulation for displaying the "Thank You" message.

    ```javascript
    // Inside the onSubmit async function in SurveyDisplayForm
    // ...
    if (result.error) {
      toast({
        /* ... error toast ... */
      });
    } else {
      toast({
        title: "Success",
        description: "Thank you for your feedback!",
      });
      localStorage.setItem(`feedbackSubmitted_${survey.id}`, "true");
      setHasSubmitted(true); // This will trigger re-render to show the thank you message
      // The setIsSubmitting(true) on line 74 of original code can be removed if hasSubmitted handles visibility
    }
    // ...
    // The setIsSubmitting(false) in the finally block (line 101 of original) is generally okay.
    // If an error occurs, the form might still be visible and should be re-enabled.
    // If success, hasSubmitted will hide the form, so isSubmitting state on the button is less critical.
    ```

5.  **Conditionally Render Form or "Thank You" Message:**

    - Wrap the main `<Form {...form}>` structure and the "Thank You" message in a conditional render based on the `hasSubmitted` state.

    ```javascript
    // In the return statement of SurveyDisplayForm component
    if (hasSubmitted) {
      return (
        <div className="text-center py-8 space-y-4">
          <div className="text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {/* SVG Icon for success */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium">Thank you for your feedback!</h3>
          <p className="text-muted-foreground">
            Your response has been recorded successfully.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            You may now close this page.
          </p>
        </div>
      );
    }

    // If not hasSubmitted, return the form:
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* ... survey.questions.map(...) and FormField structure ... */}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Feedback
          </Button>
        </form>
      </Form>
    );
    ```

---

**Summary of Changes by File:**

- **[`app/(public)/s/[surveyId]/page.jsx`](<app/(public)/s/[surveyId]/page.jsx>):**
  - Import `auth` from `@/auth`.
  - Fetch current session using `await auth()`.
  - Ensure `survey.business.userId` is fetched.
  - Implement logic to set an `isOwner` flag.
  - Conditionally render either the survey form or an "owner notice" message.
- **[`components/features/feedback/survey-display-form.jsx`](components/features/feedback/survey-display-form.jsx):**
  - Import `useEffect` from `react`.
  - Add `hasSubmitted` state, initialized to `false`.
  - Use `useEffect` to check `localStorage` for a submission flag on component mount and update `hasSubmitted` state.
  - In the `onSubmit` success handler:
    - Set the `localStorage` flag (e.g., `localStorage.setItem(\`feedbackSubmitted\_\${survey.id}\`, 'true');`).
    - Set `hasSubmitted` state to `true`.
    - Remove direct DOM manipulation for the "Thank You" message.
  - Modify `renderQuestionInput` for `RATING_SCALE_5` and `YES_NO` question types to explicitly pass `onValueChange={field.onChange}` and `value={field.value}` to the `RadioGroup` component.
  - Conditionally render the entire form or the "Thank You" message based on the `hasSubmitted` state.

This plan provides a clear path to address the reported issues by modifying the specified files with the outlined logic.
