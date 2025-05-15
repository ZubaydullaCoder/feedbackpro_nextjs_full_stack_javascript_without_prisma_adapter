"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { submitFeedback } from "@/lib/actions/feedback.actions";
import DiscountCodeDisplay from "@/components/features/feedback/discount-code-display";

// Create validation schema
const createResponseSchema = (questions) => {
  const shape = {};
  questions.forEach((question) => {
    const field = question.isRequired
      ? z.string().min(1, "This question requires an answer")
      : z.string().optional();
    shape[`question_${question.id}`] = field;
  });
  return z.object(shape);
};

export default function SurveyDisplayForm({
  survey,
  responseEntityId,
  responseType,
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [discountCode, setDiscountCode] = useState(null);

  // Log the response type for debugging
  console.log("Response type:", responseType);

  // Check if this response is eligible for a discount code
  const isEligibleForDiscount =
    responseType === "DIRECT_SMS" || responseType === "QR_INITIATED_SMS";

  const form = useForm({
    resolver: zodResolver(createResponseSchema(survey.questions)),
    defaultValues: survey.questions.reduce((acc, question) => {
      acc[`question_${question.id}`] = "";
      return acc;
    }, {}),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Transform form data into expected format
      const answers = survey.questions.map((question) => ({
        questionId: question.id,
        answer: data[`question_${question.id}`] || "",
      }));

      console.log(
        "Submitting feedback for responseEntityId:",
        responseEntityId
      );
      const result = await submitFeedback({
        surveyId: survey.id,
        responseEntityId: responseEntityId,
        answers: answers.filter((a) => a.answer.trim() !== ""), // Filter out empty answers for optional questions
      });

      console.log("Feedback submission result:", result);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Thank you for your feedback!",
        });
        console.log("Result Discount Code:", result.discountCode);

        // Check if a discount code was generated
        if (result.discountCode) {
          setDiscountCode(result.discountCode);
        }

        // Update state to show thank you message
        setHasSubmitted(true);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question, field) => {
    switch (question.type) {
      case "TEXT":
        return (
          <Textarea
            placeholder="Enter your answer..."
            className="resize-none"
            {...field}
          />
        );
      case "RATING_SCALE_5":
        return (
          <RadioGroup
            className="flex gap-4"
            onValueChange={field.onChange} // Explicitly pass react-hook-form's onChange
            value={field.value} // Explicitly pass react-hook-form's value
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={value.toString()}
                  id={`rating_${question.id}_${value}`}
                />
                <label htmlFor={`rating_${question.id}_${value}`}>
                  {value}
                </label>
              </div>
            ))}
          </RadioGroup>
        );
      case "YES_NO":
        return (
          <RadioGroup
            className="flex gap-4"
            onValueChange={field.onChange} // Explicitly pass react-hook-form's onChange
            value={field.value} // Explicitly pass react-hook-form's value
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Yes" id={`yes_${question.id}`} />
              <label htmlFor={`yes_${question.id}`}>Yes</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="No" id={`no_${question.id}`} />
              <label htmlFor={`no_${question.id}`}>No</label>
            </div>
          </RadioGroup>
        );
      default:
        return <Input placeholder="Enter your answer..." {...field} />;
    }
  };

  // If the user has already submitted feedback, show the thank you message
  if (hasSubmitted) {
    return (
      <div className="py-8 space-y-6">
        <div className="text-center space-y-4">
          <div className="text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium">Thank you for your feedback!</h3>
          <p className="text-muted-foreground">
            Your response has been recorded successfully.
          </p>
        </div>

        {discountCode ? (
          <div className="mt-8">
            <DiscountCodeDisplay
              code={discountCode.code}
              discountType={discountCode.discountType}
              discountValue={discountCode.discountValue}
              expiresAt={discountCode.expiresAt}
            />
          </div>
        ) : isEligibleForDiscount ? (
          <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <p className="text-yellow-800">
              You should have received a discount code, but something went
              wrong. Please contact support for assistance.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            You may now close this page.
          </p>
        )}
      </div>
    );
  }

  // If the user hasn't submitted feedback yet, show the form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {survey.questions.map((question, index) => (
          <FormField
            key={question.id}
            control={form.control}
            name={`question_${question.id}`}
            render={({ field }) => (
              <FormItem>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium">
                      {index + 1}. {question.text}
                    </span>
                    {!question.isRequired && (
                      <span className="text-sm text-muted-foreground">
                        (Optional)
                      </span>
                    )}
                  </div>
                  <FormControl>
                    {renderQuestionInput(question, field)}
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        ))}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Feedback
        </Button>
      </form>
    </Form>
  );
}
