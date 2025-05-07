import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Container from "@/components/shared/container";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }) {
  // Fetch the survey
  const survey = await prisma.survey.findUnique({
    where: {
      id: params.surveyId,
      status: "ACTIVE",
    },
    select: { name: true },
  });

  if (!survey) {
    return {
      title: "Survey Not Found | FeedbackPro",
    };
  }

  return {
    title: `${survey.name} | FeedbackPro`,
    description: `Provide your feedback for ${survey.name}`,
  };
}

export default async function PublicSurveyPage({ params }) {
  // Fetch the survey with its questions
  const survey = await prisma.survey.findUnique({
    where: {
      id: params.surveyId,
      status: "ACTIVE", // Only show active surveys
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      business: {
        select: { name: true },
      },
    },
  });

  // If survey not found or not active
  if (!survey) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary py-4">
        <Container size="default">
          <div className="flex justify-between items-center">
            <div className="text-primary-foreground">
              <h1 className="text-xl font-bold">FeedbackPro</h1>
            </div>
          </div>
        </Container>
      </header>

      <main className="flex-1 py-8">
        <Container size="default" className="max-w-2xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {survey.name}
              </h1>
              {survey.business?.name && (
                <p className="text-muted-foreground mt-1">
                  By {survey.business.name}
                </p>
              )}
              {survey.description && (
                <p className="mt-4 text-muted-foreground">
                  {survey.description}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-4">
              <p>
                This survey form will be implemented in Phase 4. For now, this
                page serves as a placeholder to demonstrate the QR code
                functionality.
              </p>
              <div className="space-y-4">
                {survey.questions.map((question, index) => (
                  <div key={question.id} className="space-y-2">
                    <h3 className="font-medium">
                      {index + 1}. {question.text}
                      {!question.isRequired && (
                        <span className="text-muted-foreground text-sm ml-2">
                          (Optional)
                        </span>
                      )}
                    </h3>
                    <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                      {question.type === "TEXT" && "Text input field"}
                      {question.type === "RATING_SCALE_5" &&
                        "Rating scale (1-5)"}
                      {question.type === "YES_NO" && "Yes/No buttons"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </main>

      <footer className="py-6 border-t">
        <Container size="default">
          <div className="text-center text-sm text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} FeedbackPro. All rights
              reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
