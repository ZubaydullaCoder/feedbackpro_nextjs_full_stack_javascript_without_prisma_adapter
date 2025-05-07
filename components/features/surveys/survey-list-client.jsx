"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ClipboardList,
  Eye,
  MessageSquare,
  QrCode,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Helper function to get status badge variant
const getStatusBadge = (status) => {
  switch (status) {
    case "ACTIVE":
      return { variant: "success", label: "Active" };
    case "DRAFT":
      return { variant: "outline", label: "Draft" };
    case "ARCHIVED":
      return { variant: "secondary", label: "Archived" };
    default:
      return { variant: "outline", label: status };
  }
};

export default function SurveyListClient({ surveys }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter surveys based on search term
  const filteredSurveys = surveys.filter((survey) =>
    survey.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {surveys.length > 0 ? (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search surveys..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {filteredSurveys.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSurveys.map((survey) => {
                const statusBadge = getStatusBadge(survey.status);
                return (
                  <Card key={survey.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="line-clamp-1">
                            {survey.name}
                          </CardTitle>
                          <CardDescription>
                            Created{" "}
                            {format(new Date(survey.createdAt), "MMM d, yyyy")}
                          </CardDescription>
                        </div>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ClipboardList className="h-4 w-4" />
                          <span>
                            {survey._count.questions}{" "}
                            {survey._count.questions === 1
                              ? "question"
                              : "questions"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>
                            {survey._count.responseEntities}{" "}
                            {survey._count.responseEntities === 1
                              ? "response"
                              : "responses"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-3 border-t flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1"
                      >
                        <Link href={`/surveys/${survey.id}`}>
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="gap-1"
                      >
                        <Link href={`/surveys/${survey.id}#qr`}>
                          <QrCode className="h-4 w-4" />
                          <span>QR Code</span>
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <h3 className="text-lg font-medium">No matching surveys</h3>
              <p className="text-muted-foreground mt-1">
                Try a different search term
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No surveys yet</h3>
          <p className="text-muted-foreground mt-1">
            Create your first survey to start collecting feedback
          </p>
          <Button asChild className="mt-4">
            <Link href="/surveys/new">Create Survey</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
