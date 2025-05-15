"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResponseViewer from "@/components/features/surveys/response-viewer";
import SmsInviteForm from "@/components/features/surveys/sms-invite-form";
import {
  ClipboardCheck,
  MessageSquare,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// Helper function to get question type display
const getQuestionTypeDisplay = (type) => {
  switch (type) {
    case "TEXT":
      return "Text Response";
    case "RATING_SCALE_5":
      return "Rating (1-5)";
    case "YES_NO":
      return "Yes/No";
    default:
      return type;
  }
};

export default function SurveyDetailsClient({ survey, surveyId }) {
  // Count responses - filter completed responses on the client side
  const completedResponses = survey.responseEntities.filter(
    (entity) => entity.status === "COMPLETED"
  );
  const responseCount = completedResponses.length;

  // Count SMS entities - only DIRECT_SMS now
  const smsEntities = survey.responseEntities.filter(
    (entity) => entity.type === "DIRECT_SMS"
  );
  const smsCount = smsEntities.length;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          <span>Details</span>
        </TabsTrigger>
        <TabsTrigger value="sms" className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          <span>SMS ({smsCount})</span>
        </TabsTrigger>
        <TabsTrigger value="responses" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Responses ({responseCount})</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Survey Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Status</h3>
                <Badge
                  variant={getStatusBadge(survey.status).variant}
                  className="mt-1"
                >
                  {getStatusBadge(survey.status).label}
                </Badge>
              </div>
              {survey.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {survey.description}
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-medium">Questions</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {survey.questions.length} question
                  {survey.questions.length !== 1 && "s"}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Responses</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {responseCount} response{responseCount !== 1 && "s"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {survey.questions.map((question, index) => (
                  <div key={question.id} className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium">
                        {index + 1}. {question.text}
                      </h3>
                      <Badge variant="outline">
                        {getQuestionTypeDisplay(question.type)}
                      </Badge>
                    </div>
                    {!question.isRequired && (
                      <p className="text-xs text-muted-foreground">Optional</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="sms" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Send SMS Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send a unique survey link via SMS to collect feedback from a
                specific customer. Each link includes a discount code that will
                be shown after submission.
              </p>
              <SmsInviteForm surveyId={surveyId} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SMS Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            {smsEntities.length === 0 ? (
              <div className="text-center py-8">
                <Phone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">
                  No SMS invitations have been sent yet.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {smsEntities.map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell>
                          {entity.phoneNumber ? entity.phoneNumber : "N/A"}
                        </TableCell>
                        <TableCell>
                          {new Date(entity.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              entity.status === "COMPLETED"
                                ? "success"
                                : "outline"
                            }
                          >
                            {entity.status === "COMPLETED"
                              ? "Completed"
                              : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="responses" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Survey Responses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponseViewer responses={completedResponses} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
