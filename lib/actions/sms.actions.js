"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms/sendSms";

// Schema for phone number validation
const phoneNumberSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .regex(
    /^\+?[0-9]{10,15}$/,
    "Invalid phone number format. Use international format (e.g., +998123456789)"
  );

// Schema for BO to send direct feedback SMS
const sendDirectFeedbackSmsSchema = z.object({
  surveyId: z.string().cuid("Invalid survey ID"),
  phoneNumber: phoneNumberSchema,
});

/**
 * Server action for Business Owners to send an SMS invitation for feedback
 * This is the primary method for collecting feedback in the system
 * Each SMS contains a unique link that can only be used once and includes a discount code
 * @param {Object} data - The request data
 * @param {string} data.surveyId - The ID of the survey
 * @param {string} data.phoneNumber - The phone number to send the SMS to
 * @returns {Promise<{success: boolean, message: string}>} - Result of the operation
 */
export async function sendDirectFeedbackSms(data) {
  try {
    // Get authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (
      !session ||
      !session.user ||
      session.user.role !== "BUSINESS_OWNER" ||
      !session.user.isActive
    ) {
      return {
        success: false,
        message:
          "Unauthorized. Only active business owners can send SMS invites.",
      };
    }

    // Validate input data
    const validatedData = sendDirectFeedbackSmsSchema.parse(data);
    const { surveyId, phoneNumber } = validatedData;

    // Find the business for this user
    const business = await prisma.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!business) {
      return {
        success: false,
        message: "Business profile not found",
      };
    }

    // Verify survey exists, is active, and belongs to the business
    const survey = await prisma.survey.findFirst({
      where: {
        id: surveyId,
        businessId: business.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!survey) {
      return {
        success: false,
        message:
          "Survey not found, inactive, or does not belong to your business",
      };
    }

    // Create a new ResponseEntity record
    const responseEntity = await prisma.responseEntity.create({
      data: {
        type: "DIRECT_SMS",
        status: "PENDING",
        phoneNumber,
        surveyId,
      },
    });

    // Generate unique feedback URL
    const uniqueUrl = `${process.env.NEXTAUTH_URL}/feedback/${responseEntity.id}`;

    // Send SMS
    await sendSms(
      phoneNumber,
      `You've been invited to provide feedback for ${survey.name}. Please click this link: ${uniqueUrl}`
    );

    return {
      success: true,
      message: "SMS invitation sent successfully",
    };
  } catch (error) {
    console.error("Error in sendDirectFeedbackSms:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: error.errors[0].message || "Invalid input data",
      };
    }

    return {
      success: false,
      message: "Failed to send SMS invitation. Please try again.",
    };
  }
}
