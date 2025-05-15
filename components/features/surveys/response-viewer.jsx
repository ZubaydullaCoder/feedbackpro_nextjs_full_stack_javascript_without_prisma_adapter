"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

// Helper function to format date
const formatDate = (date) => {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
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

export default function ResponseViewer({ responses }) {
  const [expandedResponse, setExpandedResponse] = useState(null);

  // Toggle expanded response
  const toggleResponse = (id) => {
    setExpandedResponse(expandedResponse === id ? null : id);
  };

  if (!responses || responses.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No responses yet</h3>
        <p className="text-muted-foreground mt-1">
          Share your survey to start collecting feedback
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          {responses.length} Response{responses.length !== 1 && "s"}
        </h3>
      </div>

      {responses.map((response) => (
        <Card key={response.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  Response #{response.id.substring(0, 8)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Submitted on {formatDate(response.createdAt)}
                </p>
              </div>
              <Badge variant="outline">
                {response.type === "QR" ? "QR Code" : "SMS"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between"
              onClick={() => toggleResponse(response.id)}
            >
              <span>
                {expandedResponse === response.id
                  ? "Hide Responses"
                  : "View Responses"}
              </span>
              {expandedResponse === response.id ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {expandedResponse === response.id && (
              <div className="mt-4 space-y-4 border-t pt-4">
                {response.responses.map((answer) => (
                  <div key={answer.id} className="space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">
                        {answer.question.text}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getQuestionTypeDisplay(answer.question.type)}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      {answer.value || (
                        <em className="text-muted-foreground">
                          No answer provided
                        </em>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
