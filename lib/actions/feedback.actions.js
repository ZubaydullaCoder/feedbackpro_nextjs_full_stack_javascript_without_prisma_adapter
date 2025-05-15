"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateAndAssignDiscountCode } from "@/lib/actions/incentives.actions";

// Input validation schema for feedback submission
const submitFeedbackSchema = z.object({
  surveyId: z.string().cuid("Invalid survey ID."),
  responseEntityId: z.string().cuid("Invalid response entity ID."),
  answers: z
    .array(
      z.object({
        questionId: z.string().cuid("Invalid question ID."),
        answer: z
          .string()
          .min(1, "Answer cannot be empty.")
          .max(1000, "Answer is too long."),
      })
    )
    .min(1, "At least one answer is required."),
});

/**
 * Server action to submit feedback for a survey
 * @param {Object} data - Feedback submission data
 * @returns {Promise<Object>} Result of the submission
 */
export async function submitFeedback(data) {
  try {
    // 1. Validate input data
    const validatedData = submitFeedbackSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        error: "Validation failed",
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    // 2. Fetch the response entity and verify it exists and is in PENDING status
    const responseEntity = await prisma.responseEntity.findUnique({
      where: {
        id: validatedData.data.responseEntityId,
      },
      select: {
        id: true,
        status: true,
        surveyId: true,
        type: true,
        phoneNumber: true,
      },
    });

    if (!responseEntity) {
      return {
        error: "Invalid feedback link. Please check the URL and try again.",
      };
    }

    if (responseEntity.status !== "PENDING") {
      return { error: "Feedback has already been submitted for this link." };
    }

    // 3. Verify survey exists and is active
    const survey = await prisma.survey.findUnique({
      where: {
        id: validatedData.data.surveyId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        questions: {
          select: { id: true },
        },
      },
    });

    if (!survey) {
      return { error: "Survey not found or is inactive." };
    }

    // 4. Verify the response entity belongs to the specified survey
    if (responseEntity.surveyId !== survey.id) {
      return { error: "Invalid survey for this feedback link." };
    }

    // 5. Verify all questionIds belong to this survey
    const validQuestionIds = new Set(survey.questions.map((q) => q.id));
    const allQuestionsValid = validatedData.data.answers.every((answer) =>
      validQuestionIds.has(answer.questionId)
    );

    if (!allQuestionsValid) {
      return { error: "Invalid question ID detected." };
    }

    // 6. Create responses and update response entity status in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create individual responses
      for (const answer of validatedData.data.answers) {
        await tx.response.create({
          data: {
            responseEntityId: responseEntity.id,
            questionId: answer.questionId,
            value: answer.answer, // Using 'value' field to match the database column
          },
        });
      }

      // Update response entity status to COMPLETED
      const updatedResponseEntity = await tx.responseEntity.update({
        where: {
          id: responseEntity.id,
        },
        data: {
          status: "COMPLETED",
          submittedAt: new Date(),
        },
      });

      return updatedResponseEntity;
    });

    // 7. Generate a discount code for DIRECT_SMS responses
    let discountCode = null;
    console.log("Response entity type:", responseEntity.type);

    if (responseEntity.type === "DIRECT_SMS") {
      console.log("SMS response detected, generating discount code");

      // Get the business ID from the survey
      const survey = await prisma.survey.findUnique({
        where: { id: responseEntity.surveyId },
        select: { businessId: true },
      });

      console.log("Survey business ID:", survey?.businessId);

      if (survey) {
        // Generate and assign a discount code
        const discountCodeResult = await generateAndAssignDiscountCode({
          responseEntityId: responseEntity.id,
          businessId: survey.businessId,
          discountType: "PERCENTAGE", // Default type
          discountValue: 10, // Default value (10%)
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        });

        console.log("Discount code generation result:", discountCodeResult);

        if (discountCodeResult.success) {
          discountCode = discountCodeResult.discountCode;
          console.log("Discount code generated:", discountCode);
        } else {
          console.error(
            "Failed to generate discount code:",
            discountCodeResult.error
          );
        }
      }
    } else {
      console.log(
        "Not a DIRECT_SMS response, skipping discount code generation"
      );
    }

    // 8. Return success response
    return {
      success: true,
      message: "Feedback submitted successfully.",
      responseEntityId: result.id,
      discountCode,
    };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return {
      error: "Failed to submit feedback. Please try again.",
    };
  }
}
