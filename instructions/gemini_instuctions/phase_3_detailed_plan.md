Detailed Plan for Phase 3: Core Survey Management (BO)
Overall Goal: Enable Business Owners (BOs) to create surveys, view their basic survey details, and generate QR codes for these surveys. This phase focuses on establishing the foundational models and CRUD operations for surveys from the BO's perspective.

Here's a step-by-step breakdown:

3.1. Update Prisma Schema & Migrate
File: d:\web development\2025\codevision works\feedbackpro-web-app\full*stack_nextjs\attempt_5_javascript\prisma\schema.prisma
Task: Define Business, Survey, and Question models, along with necessary enums and relations.
Detailed Logic & Keywords:
Business Model:
id: String, CUID default.
name: String (e.g., company name, optional for now, could be added later).
userId: String, unique. This creates a one-to-one relation with the User model.
user: Relation field back to User (@relation(fields: [userId], references: [id], onDelete: Cascade)).
surveys: Relation field to list of Surveys (Survey[]).
createdAt, updatedAt.
Survey Model:
id: String, CUID default.
name: String.
description: String, optional.
status: SurveyStatus enum (e.g., DRAFT, ACTIVE, ARCHIVED), default ACTIVE.
businessId: String.
business: Relation field to Business (@relation(fields: [businessId], references: [id], onDelete: Cascade)).
questions: Relation field to list of Questions (Question[]).
responseEntities: Relation field to ResponseEntity[] (for Phase 4).
createdAt, updatedAt.
@@index([businessId]).
Question Model:
id: String, CUID default.
text: String (the question itself).
type: QuestionType enum (e.g., TEXT, RATING_SCALE_5, YES_NO).
order: Int (for display order within a survey).
isRequired: Boolean, default true.
surveyId: String.
survey: Relation field to Survey (@relation(fields: [surveyId], references: [id], onDelete: Cascade)).
responses: Relation field to Response[] (for Phase 4).
createdAt, updatedAt.
@@index([surveyId]).
Enums:
SurveyStatus: DRAFT | ACTIVE | ARCHIVED
QuestionType: TEXT | RATING_SCALE_5 | YES_NO (start with these, can expand).
Action: Run npx prisma migrate dev --name add-survey-models.
Verification:
Confirm migration completes successfully.
Inspect the database schema (e.g., via npx prisma studio) to ensure Business, Survey, Question tables are created with correct columns, relations, and foreign key constraints.
3.2. Create Business Owner (BO) Layout
File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(bo)\layout.jsx
Task: Create a layout component that protects routes under (bo) group and provides common UI elements for BOs.
Detailed Logic & Keywords:
This will be a Server Component.
Import auth from @/lib/auth and redirect from next/navigation.
In the layout component, call await auth().
Authentication Check:
If !session?.user, redirect to /login.
If session.user.role !== 'BUSINESS_OWNER', redirect to a relevant page (e.g., / or an "unauthorized" page).
If !session.user.isActive, redirect to /login (or an "account inactive" page) with an appropriate message/toast trigger if possible (though toasts from server components are tricky; might need a query param).
Structure:
Include a basic navigation bar/sidebar for BO sections (e.g., "Dashboard", "Surveys", "Verify Code").
Render {children}.
Verification:
Try accessing a (bo) route without logging in; expect redirection to /login.
Log in as a non-BO user (e.g., Admin if created, or a user with no role/different role); expect redirection.
Log in as an inactive BO; expect redirection.
Log in as an active BO; expect the layout and child page to render.
3.3. Create "Create Survey" Page and Form
Page File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(bo)\surveys\new\page.jsx
This will be a Server Component (or a simple wrapper).
It will primarily render the client form component.
Form Component File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\components\features\surveys\survey-form.jsx
Mark as "use client".
Task: Build a form for creating a new survey, including its questions.
Detailed Logic & Keywords:
Import useForm from react-hook-form, zodResolver from @hookform/resolvers/zod.
Import useRouter from next/navigation for redirection.
Import useToast from @/components/ui/use-toast.
Import the createSurvey server action (to be created in step 3.4).
Zod Schema (Client-side & Server-side): Define a Zod schema for survey creation.
name: z.string().min(3)
description: z.string().optional()
questions: z.array(z.object({ text: z.string().min(1), type: z.nativeEnum(QuestionType) /* Prisma enum _/, order: z.number().int() })).min(1) (ensure QuestionType enum is available to Zod, or map string values).
Form State:
Use useForm with the Zod schema.
Use useFieldArray from react-hook-form to manage dynamic question fields (add question, remove question, reorder questions - reordering is advanced, maybe just add/remove for MVP).
UI:
Input for survey name.
Textarea for survey description.
Section for questions:
Button to "Add Question".
For each question: input for text, select for type (populated from QuestionType enum values), button to "Remove Question".
order can be managed implicitly by array index.
Submit button.
Submission Handling:
onSubmit function passed to form.handleSubmit.
Call await createSurvey(data).
On success:
Show success toast.
router.push('/(bo)/surveys') or to the newly created survey's detail page.
On error:
Show error toast with error.message.
Verification (UI part):
Page loads with form fields.
Able to add/remove questions dynamically.
Client-side validation (e.g., required fields) shows errors.
3.4. Create createSurvey Server Action
File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\lib\actions\survey.actions.js
Task: Implement the server-side logic to create a survey and its associated business and questions.
Detailed Logic & Keywords:
Import prisma client from @/lib/prisma.
Import auth helper from @/lib/auth.
Import zod and define the same Zod schema as used in survey-form.jsx for validation.
Function signature: export async function createSurvey(formData)
Authentication & Authorization:
const session = await auth();
If !session?.user or session.user.role !== 'BUSINESS_OWNER' or !session.user.isActive, return { error: "Unauthorized" } or throw an error.
Get userId = session.user.id.
Input Validation:
const validationResult = surveyCreateSchema.safeParse(formData);
If !validationResult.success, return { error: "Invalid input", details: validationResult.error.format() }.
Extract name, description, questions from validationResult.data.
Database Operations (within prisma.$transaction):
Find or Create Business:
let business = await prisma.business.findUnique({ where: { userId } });
If !business:
business = await prisma.business.create({ data: { userId, name: session.user.name || session.user.email } }); (Use user's name or email as a default business name if not provided separately).
Create Survey:
const survey = await prisma.survey.create({ data: { name, description, businessId: business.id, status: 'ACTIVE' /* or DRAFT */ } });
Create Questions:
If questions array is not empty:
await prisma.question.createMany({ data: questions.map((q, index) => ({ text: q.text, type: q.type, surveyId: survey.id, order: q.order !== undefined ? q.order : index })) });
(Note: createMany doesn't return the created records with IDs for all DBs, but for this flow, we might not need them immediately back in the action's response).
Return Value:
On success: { success: true, message: "Survey created successfully!", data: { surveyId: survey.id } }.
On error (caught by try-catch around transaction): { error: "Failed to create survey. Please try again." }.
Verification (Logic part, after UI calls it):
Log in as BO, create a survey.
Check success toast and redirection.
Database Check:
Business record exists/is found for the userId.
Survey record created, linked to the correct businessId.
Question records created, linked to the correct surveyId, with correct text, type, and order.
Attempt creation without auth/invalid role: verify error.
Attempt creation with invalid data: verify server-side validation error.
3.5. Create "List Surveys" Page
File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(bo)\surveys\page.jsx
Task: Display a list of surveys created by the logged-in Business Owner.
Detailed Logic & Keywords:
This will be a Server Component.
Import prisma client.
Import auth helper.
Import a client component for displaying the list (e.g., SurveyListClient.jsx).
Authentication & Authorization:
const session = await auth(); (Handled by (bo)/layout.jsx, but good to re-verify or get userId).
const userId = session.user.id;
Data Fetching:
Find the Business associated with userId: const business = await prisma.business.findUnique({ where: { userId } });
If business:
Fetch surveys: const surveys = await prisma.survey.findMany({ where: { businessId: business.id }, orderBy: { createdAt: 'desc' } });
Else, surveys = [].
Rendering:
Pass the surveys data to a client component (SurveyListClient.jsx) for rendering. This component can handle the display logic, links to detail pages, etc.
Include a "Create New Survey" button/link pointing to /(bo)/surveys/new.
Client Component for List (e.g., components/features/surveys/survey-list-client.jsx):
"use client"
Receives surveys as a prop.
Renders a table or list of surveys, showing name, status, createdAt, and a link/button to view details (/(bo)/surveys/[surveyId]).
Verification:
Log in as BO. Navigate to /surveys.
Verify previously created surveys are listed.
If no surveys, a "No surveys found. Create one!" message should appear.
Links to survey details should be correct.
3.6. Create "View Survey Details" Page
File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\(bo)\surveys\[surveyId]\page.jsx
Task: Display the details of a specific survey, including its questions and a QR code.
Detailed Logic & Keywords:
This will be a Server Component.
Import prisma client.
Import auth helper.
Import notFound from next/navigation.
Import a client component for displaying details (e.g., SurveyDetailsClient.jsx).
Route Parameter: Receives params.surveyId.
Authentication & Authorization:
const session = await auth();
const userId = session.user.id;
Data Fetching:
Fetch the Business for the userId: const business = await prisma.business.findUnique({ where: { userId } });
If !business, call notFound() or handle appropriately.
Fetch survey: const survey = await prisma.survey.findUnique({ where: { id: params.surveyId, businessId: business.id }, include: { questions: { orderBy: { order: 'asc' } } } });
If !survey, call notFound().
Rendering:
Pass the survey object (and surveyId) to SurveyDetailsClient.jsx.
Client Component for Details (e.g., components/features/surveys/survey-details-client.jsx):
"use client"
Receives survey (initial data) and surveyId as props.
Import useQuery from @tanstack/react-query.
Import Image from next/image.
UI:
Display survey name, description, status.
List questions (text, type).
Section for QR Code.
QR Code Fetching & Display:
Use useQuery to fetch QR code data from the API route (created in step 3.7).
queryKey: ['surveyQr', surveyId]
queryFn: async () => { const res = await fetch(\/api/survey/${surveyId}/qr`); if (!res.ok) throw new Error('Failed to fetch QR'); return res.json(); }`
enabled: !!surveyId
If isLoadingQr, show loading placeholder.
If isErrorQr, show error message.
If data (e.g., { qrCode: 'dataURL', surveyUrl: '...' }):
Display the QR code using <Image src={data.qrCode} alt="Survey QR Code" width={200} height={200} />.
Display the surveyUrl with a "Copy to Clipboard" button.
Verification:
Navigate to a survey's detail page.
Verify survey name, description, questions are displayed.
Verify QR code section shows loading, then the QR code and link.
Attempt to access a survey not belonging to the BO; expect 404.
3.7. Create QR Code API Route
File: d:\web development\2025\codevision works\feedbackpro-web-app\full_stack_nextjs\attempt_5_javascript\app\api\survey\[surveyId]\qr\route.js
Task: Generate and return a QR code for a given survey.
Detailed Logic & Keywords:
Import qrcode library.
Import NextResponse from next/server.
Import prisma client.
GET(request, { params }) function:
const surveyId = params.surveyId;
Validate surveyId: (Optional, but good practice) Check if it's a valid CUID format.
Fetch Survey (minimal):
const survey = await prisma.survey.findUnique({ where: { id: surveyId, status: 'ACTIVE' /_ Or any status you want QR for \_/ }, select: { id: true } });
If !survey, return NextResponse.json({ error: "Survey not found or not active" }, { status: 404 }).
Construct Public Survey URL:
const publicSurveyUrl = \${process.env.NEXTAUTH_URL}/s/${surveyId}`;(EnsureNEXTAUTH_URLis set in.env`).
Generate QR Code Data URL:
const qrCodeDataUrl = await qrcode.toDataURL(publicSurveyUrl);
Return JSON Response:
return NextResponse.json({ qrCode: qrCodeDataUrl, surveyUrl: publicSurveyUrl });
Verification:
Directly access the API route in browser/Postman (e.g., /api/survey/your-survey-id/qr).
Verify JSON response contains qrCode (base64 data URL) and surveyUrl.
Test with an invalid/non-existent surveyId; expect 404 error.
3.8. Add QR Display/Link to Details Page (Covered in 3.6 Client Component)
This is primarily about integrating the useQuery call in SurveyDetailsClient.jsx to fetch from the API route created in 3.7 and render the QR code image and link.
General Checks for Phase 3 (as per Development Breakdown):

BO Login & Survey Creation:
Log in as BO.
Navigate to /surveys/new.
Create a survey with multiple questions.
Verify success toast, redirection (e.g., to /surveys or the new survey's detail page).
Verify Business, Survey, Question records in DB are correct.
List Surveys:
Navigate to /surveys.
Verify the newly created survey (and any others by this BO) is listed.
View Survey Details & QR Code:
Click on a survey from the list.
Verify its details page shows correct data (name, description, questions).
Verify the QR code loads correctly and contains the correct public URL (e.g., http://localhost:3000/s/[surveyId]). You can scan it with a phone to check.
This detailed plan should guide the AI assistant effectively through Phase 3, focusing on the logic and key implementation details.
