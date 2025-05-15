import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Container from "@/components/shared/container";
import { Separator } from "@/components/ui/separator";
import SurveyDisplayForm from "@/components/features/feedback/survey-display-form";
import { auth } from "@/auth";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export async function generateMetadata({ params }) {
  const { responseEntityId } = await params;

  // Fetch the response entity with survey
  const responseEntity = await prisma.responseEntity.findUnique({
    where: {
      id: responseEntityId,
    },
    include: {
      survey: {
        select: { name: true },
      },
    },
  });

  if (!responseEntity || !responseEntity.survey) {
    return {
      title: "Feedback Link Invalid | FeedbackPro",
    };
  }

  return {
    title: `${responseEntity.survey.name} | FeedbackPro`,
    description: `Provide your feedback for ${responseEntity.survey.name}`,
  };
}

export default async function UniqueFeedbackPage({ params }) {
  const session = await auth(); // Get current session
  const { responseEntityId } = await params;

  // Fetch the response entity with survey and questions
  const responseEntity = await prisma.responseEntity.findUnique({
    where: {
      id: responseEntityId,
    },
    include: {
      survey: {
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          business: {
            select: {
              name: true,
              userId: true, // For ownership check
            },
          },
        },
      },
    },
  });

  // Log response entity details for debugging
  console.log("Response entity details:", {
    id: responseEntity?.id,
    type: responseEntity?.type,
    status: responseEntity?.status,
    phoneNumber: responseEntity?.phoneNumber,
  });

  // If response entity not found or survey not found
  if (!responseEntity || !responseEntity.survey) {
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
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Link</AlertTitle>
              <AlertDescription>
                This feedback link is invalid or has expired. Please check the
                URL and try again.
              </AlertDescription>
            </Alert>
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

  // Check if feedback has already been submitted
  if (responseEntity.status === "COMPLETED") {
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
                  {responseEntity.survey.name}
                </h1>
                {responseEntity.survey.business?.name && (
                  <p className="text-muted-foreground mt-1">
                    By {responseEntity.survey.business.name}
                  </p>
                )}
              </div>
              <Separator />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Already Submitted</AlertTitle>
                <AlertDescription>
                  Feedback has already been submitted for this link. Each link
                  can only be used once.
                </AlertDescription>
              </Alert>
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

  // Check if the current user is the owner of this survey
  let isOwner = false;
  if (
    session?.user?.id &&
    session.user.role === "BUSINESS_OWNER" &&
    responseEntity.survey.business?.userId === session.user.id
  ) {
    isOwner = true;
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
                {responseEntity.survey.name}
              </h1>
              {responseEntity.survey.business?.name && (
                <p className="text-muted-foreground mt-1">
                  By {responseEntity.survey.business.name}
                </p>
              )}
              {responseEntity.survey.description && (
                <p className="mt-4 text-muted-foreground">
                  {responseEntity.survey.description}
                </p>
              )}
            </div>
            <Separator />
            <div className="space-y-6">
              {isOwner ? (
                <div className="text-center py-8 px-4 rounded-md bg-yellow-50 border border-yellow-200">
                  <h2 className="text-xl font-semibold text-yellow-700">
                    Survey Notice
                  </h2>
                  <p className="text-yellow-600 mt-2">
                    You are viewing your own survey. As the owner, you cannot
                    submit feedback.
                  </p>
                  <p className="text-sm text-yellow-500 mt-1">
                    To test the survey, please open this link in an incognito
                    window or a different browser where you are not logged in.
                  </p>
                </div>
              ) : (
                <SurveyDisplayForm
                  survey={responseEntity.survey}
                  responseEntityId={responseEntity.id}
                  responseType={responseEntity.type}
                />
              )}
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
