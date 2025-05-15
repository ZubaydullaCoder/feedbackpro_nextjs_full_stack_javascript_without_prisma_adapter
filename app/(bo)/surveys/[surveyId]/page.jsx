import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SurveyDetailsClient from "@/components/features/surveys/survey-details-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export async function generateMetadata({ params }) {
  const session = await auth();
  const userId = session.user.id;
  const { surveyId } = await params;

  // Find the business for this user
  const business = await prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    return {
      title: "Survey Not Found | FeedbackPro",
    };
  }

  // Fetch the survey
  const survey = await prisma.survey.findUnique({
    where: {
      id: surveyId,
      businessId: business.id,
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
    description: `View details and responses for ${survey.name}`,
  };
}

export default async function SurveyDetailsPage({ params }) {
  const session = await auth();
  const userId = session.user.id;
  const { surveyId } = await params;

  // Find the business for this user
  const business = await prisma.business.findUnique({
    where: { userId },
  });

  if (!business) {
    notFound();
  }

  // Fetch the survey with its questions and responses
  const survey = await prisma.survey.findUnique({
    where: {
      id: surveyId,
      businessId: business.id,
    },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      responseEntities: {
        // No filter on status for now to avoid the enum issue
        orderBy: { createdAt: "desc" },
        include: {
          responses: {
            include: {
              question: {
                select: {
                  text: true,
                  type: true,
                  order: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!survey) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
              <Link href="/surveys">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to surveys</span>
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">{survey.name}</h1>
          </div>
          <p className="text-muted-foreground">
            Created on{" "}
            {new Date(survey.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
      <Separator />
      <SurveyDetailsClient survey={survey} surveyId={surveyId} />
    </div>
  );
}
