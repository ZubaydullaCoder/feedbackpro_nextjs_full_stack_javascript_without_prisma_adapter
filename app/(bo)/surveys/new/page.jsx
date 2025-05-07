import { auth } from "@/auth";
import SurveyForm from "@/components/features/surveys/survey-form";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Create New Survey | FeedbackPro",
  description: "Create a new survey to collect feedback from your customers",
};

export default async function NewSurveyPage() {
  // Auth is handled by the layout, but we need the session for the form
  const session = await auth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create New Survey</h1>
        <p className="text-muted-foreground mt-2">
          Design a survey to collect feedback from your customers via QR code or SMS.
        </p>
      </div>
      <Separator />
      <SurveyForm userId={session.user.id} />
    </div>
  );
}
