"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { sendDirectFeedbackSms } from "@/lib/actions/sms.actions";

// Validation schema for phone number
const phoneNumberSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(
      /^\+?[0-9]{10,15}$/,
      "Invalid phone number format. Use international format (e.g., +998123456789)"
    ),
});

export default function SmsInviteForm({ surveyId, onSmsSuccess }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(phoneNumberSchema),
    defaultValues: {
      phoneNumber: "",
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await sendDirectFeedbackSms({
        surveyId,
        phoneNumber: data.phoneNumber,
      });

      if (result.success) {
        toast({
          title: "SMS Invitation Sent",
          description: "The feedback invitation has been sent successfully",
        });
        reset(); // Clear the form
        if (onSmsSuccess) {
          onSmsSuccess(); // Callback to refresh SMS tracking list
        }
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            result.message || "Failed to send SMS. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error sending SMS invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+998123456789"
              {...register("phoneNumber")}
              disabled={isSubmitting}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-destructive mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter the recipient's phone number in international format (e.g.,
          +998123456789). The customer will receive a unique link with a
          discount code after completing the survey.
        </p>
      </div>
    </form>
  );
}
