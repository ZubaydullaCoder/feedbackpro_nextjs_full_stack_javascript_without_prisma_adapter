"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck,
  ClipboardCopy,
  Loader2,
  QrCode,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

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
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Fetch QR code data
  const {
    data: qrData,
    isLoading: isLoadingQr,
    isError: isErrorQr,
    error: qrError,
  } = useQuery({
    queryKey: ["surveyQr", surveyId],
    queryFn: async () => {
      const res = await fetch(`/api/survey/${surveyId}/qr`);
      if (!res.ok) {
        throw new Error("Failed to fetch QR code");
      }
      return res.json();
    },
  });

  // Handle copy to clipboard
  const copyToClipboard = () => {
    if (qrData?.surveyUrl) {
      navigator.clipboard.writeText(qrData.surveyUrl);
      setCopied(true);
      toast({
        title: "URL Copied",
        description: "Survey URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Count responses
  const responseCount = survey.responseEntities.filter(
    (entity) => entity.status === "COMPLETED"
  ).length;

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
        <TabsTrigger value="details" className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          <span>Details</span>
        </TabsTrigger>
        <TabsTrigger value="qr" className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          <span>QR Code</span>
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

      <TabsContent value="qr" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {isLoadingQr && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Generating QR code...
                </p>
              </div>
            )}

            {isErrorQr && (
              <div className="flex flex-col items-center justify-center py-8 text-destructive">
                <AlertCircle className="h-8 w-8" />
                <p className="mt-2 text-sm">
                  Error generating QR code:{" "}
                  {qrError?.message || "Unknown error"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            )}

            {qrData && (
              <div className="flex flex-col items-center">
                <div className="border p-4 rounded-lg bg-white">
                  <Image
                    src={qrData.qrCode}
                    alt="Survey QR Code"
                    width={200}
                    height={200}
                    priority
                  />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Scan this QR code to access the survey
                </p>
                <div className="mt-6 flex flex-col items-center">
                  <p className="text-sm font-medium mb-2">Survey URL:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-sm">
                      {qrData.surveyUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <ClipboardCheck className="h-4 w-4" />
                      ) : (
                        <ClipboardCopy className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {copied ? "Copied" : "Copy URL"}
                      </span>
                    </Button>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="text-center">
                  <h3 className="font-medium">Print or Download</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Save this QR code to use in your physical location
                  </p>
                  <Button
                    onClick={() => {
                      const printWindow = window.open("", "_blank");
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Survey QR Code - ${survey.name}</title>
                            <style>
                              body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
                              h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                              img { max-width: 100%; height: auto; }
                              .container { max-width: 500px; margin: 0 auto; }
                              .qr-container { border: 1px solid #ddd; padding: 1rem; display: inline-block; background: white; }
                              .url { margin-top: 1rem; font-family: monospace; word-break: break-all; }
                            </style>
                          </head>
                          <body>
                            <div class="container">
                              <h1>${survey.name}</h1>
                              <div class="qr-container">
                                <img src="${qrData.qrCode}" alt="Survey QR Code" />
                              </div>
                              <p class="url">${qrData.surveyUrl}</p>
                              <p>Scan this QR code to provide feedback</p>
                            </div>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                      printWindow.focus();
                      setTimeout(() => {
                        printWindow.print();
                      }, 250);
                    }}
                  >
                    Print QR Code
                  </Button>
                </div>
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
            {responseCount === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No responses yet</h3>
                <p className="text-muted-foreground mt-1">
                  Share your survey to start collecting feedback
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Response details will be implemented in Phase 4
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
