"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createSurvey } from "@/lib/actions/survey.actions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Define the question types
const QUESTION_TYPES = [
  { value: "TEXT", label: "Text Response" },
  { value: "RATING_SCALE_5", label: "Rating (1-5)" },
  { value: "YES_NO", label: "Yes/No" },
];

// Define the form schema with Zod
const surveyFormSchema = z.object({
  name: z.string().min(3, "Survey name must be at least 3 characters"),
  description: z.string().optional(),
  questions: z
    .array(
      z.object({
        text: z.string().min(1, "Question text is required"),
        type: z.enum(["TEXT", "RATING_SCALE_5", "YES_NO"], {
          required_error: "Please select a question type",
        }),
      })
    )
    .min(1, "At least one question is required"),
});

export default function SurveyForm({ userId }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm({
    resolver: zodResolver(surveyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      questions: [
        {
          text: "",
          type: "TEXT",
        },
      ],
    },
  });

  // Setup field array for dynamic questions
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  // Handle form submission
  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Add order to questions based on their position in the array
      const formattedData = {
        ...data,
        questions: data.questions.map((question, index) => ({
          ...question,
          order: index,
        })),
      };

      const result = await createSurvey(formattedData);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });

        // If it's a user not found error, redirect to login
        if (result.error.includes("User not found")) {
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } else {
        toast({
          title: "Success",
          description: "Survey created successfully!",
        });
        router.push("/surveys");
      }
    } catch (error) {
      console.error("Error creating survey:", error);
      toast({
        title: "Error",
        description: "Failed to create survey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Survey Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Customer Satisfaction Survey"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Give your survey a clear, descriptive name.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Help us improve our service by sharing your feedback..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                A brief description of the survey's purpose.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Questions</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ text: "", type: "TEXT" })}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="overflow-hidden">
              <CardContent className="p-4 pt-4">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="font-medium">Question {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 -mt-1 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove question</span>
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`questions.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="How would you rate our service?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`questions.${index}.type`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a question type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {QUESTION_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {form.formState.errors.questions?.root && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.questions.root.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Survey
          </Button>
        </div>
      </form>
    </Form>
  );
}
