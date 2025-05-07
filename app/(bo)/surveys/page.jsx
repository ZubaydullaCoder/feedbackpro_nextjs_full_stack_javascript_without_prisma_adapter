import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SurveyListClient from "@/components/features/surveys/survey-list-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Surveys | FeedbackPro",
  description: "Manage your feedback surveys",
};

export default async function SurveysPage() {
  const session = await auth();
  const userId = session.user.id;

  // Find the business for this user
  const business = await prisma.business.findUnique({
    where: { userId },
  });

  // Fetch surveys if business exists
  let surveys = [];
  if (business) {
    surveys = await prisma.survey.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, responseEntities: true },
        },
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Surveys</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your feedback surveys
          </p>
        </div>
        <Button asChild>
          <Link href="/surveys/new" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            New Survey
          </Link>
        </Button>
      </div>
      <Separator />
      <SurveyListClient surveys={surveys} />
    </div>
  );
}
