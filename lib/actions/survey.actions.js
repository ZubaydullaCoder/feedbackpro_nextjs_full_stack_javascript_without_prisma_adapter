"use server";

import * as z from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Define the Zod schema for survey creation
const questionSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["TEXT", "RATING_SCALE_5", "YES_NO"], {
    required_error: "Please select a question type",
  }),
  order: z.number().int(),
});

const surveyCreateSchema = z.object({
  name: z.string().min(3, "Survey name must be at least 3 characters"),
  description: z.string().optional(),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required"),
});

/**
 * Creates a new survey with associated questions
 * @param {Object} formData - The survey data from the form
 * @returns {Promise<Object>} - Result object with success/error information
 */
export async function createSurvey(formData) {
  try {
    // Get the authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session?.user || session.user.role !== "BUSINESS_OWNER") {
      return {
        error: "Unauthorized. Only business owners can create surveys.",
      };
    }

    // Check if user is active
    if (!session.user.isActive) {
      return { error: "Your account is inactive. Please contact support." };
    }

    // Validate the input data
    const validationResult = surveyCreateSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        error: "Invalid input data",
        details: validationResult.error.format(),
      };
    }

    // Extract validated data
    const { name, description, questions } = validationResult.data;
    const userId = session.user.id;

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Find or create the business for this user
      let business = await tx.business.findUnique({
        where: { userId },
      });

      if (!business) {
        // Create a new business if one doesn't exist
        business = await tx.business.create({
          data: {
            userId,
            name: session.user.name || session.user.email,
          },
        });
      }

      // Create the survey
      const survey = await tx.survey.create({
        data: {
          name,
          description,
          businessId: business.id,
          status: "ACTIVE",
        },
      });

      // Create the questions
      if (questions.length > 0) {
        await tx.question.createMany({
          data: questions.map((q) => ({
            text: q.text,
            type: q.type,
            order: q.order,
            surveyId: survey.id,
          })),
        });
      }

      return { survey };
    });

    return {
      success: true,
      message: "Survey created successfully!",
      data: { surveyId: result.survey.id },
    };
  } catch (error) {
    console.error("Error creating survey:", error);
    return {
      error: "Failed to create survey. Please try again.",
    };
  }
}

/**
 * Fetches all surveys for the authenticated business owner
 * @returns {Promise<Object>} - Result object with surveys or error
 */
export async function getSurveys() {
  try {
    // Get the authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session?.user || session.user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized. Only business owners can view surveys." };
    }

    // Check if user is active
    if (!session.user.isActive) {
      return { error: "Your account is inactive. Please contact support." };
    }

    const userId = session.user.id;

    // Find the business for this user
    const business = await prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      return { surveys: [] }; // No business found, return empty array
    }

    // Fetch surveys for this business
    const surveys = await prisma.survey.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { questions: true, responseEntities: true },
        },
      },
    });

    return { surveys };
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return {
      error: "Failed to fetch surveys. Please try again.",
    };
  }
}

/**
 * Fetches a specific survey with its questions
 * @param {string} surveyId - The ID of the survey to fetch
 * @returns {Promise<Object>} - Result object with survey or error
 */
export async function getSurvey(surveyId) {
  try {
    // Get the authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session?.user || session.user.role !== "BUSINESS_OWNER") {
      return { error: "Unauthorized. Only business owners can view surveys." };
    }

    // Check if user is active
    if (!session.user.isActive) {
      return { error: "Your account is inactive. Please contact support." };
    }

    const userId = session.user.id;

    // Find the business for this user
    const business = await prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      return { error: "Business not found." };
    }

    // Fetch the survey with its questions
    const survey = await prisma.survey.findUnique({
      where: {
        id: surveyId,
        businessId: business.id, // Ensure the survey belongs to this business
      },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        responseEntities: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!survey) {
      return { error: "Survey not found." };
    }

    return { survey };
  } catch (error) {
    console.error("Error fetching survey:", error);
    return {
      error: "Failed to fetch survey. Please try again.",
    };
  }
}

/**
 * Deletes a survey and all associated data
 * @param {string} surveyId - The ID of the survey to delete
 * @returns {Promise<Object>} - Result object with success/error information
 */
export async function deleteSurvey(surveyId) {
  try {
    // Get the authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session?.user || session.user.role !== "BUSINESS_OWNER") {
      return {
        error: "Unauthorized. Only business owners can delete surveys.",
      };
    }

    // Check if user is active
    if (!session.user.isActive) {
      return { error: "Your account is inactive. Please contact support." };
    }

    const userId = session.user.id;

    // Find the business for this user
    const business = await prisma.business.findUnique({
      where: { userId },
    });

    if (!business) {
      return { error: "Business not found." };
    }

    // Check if the survey exists and belongs to this business
    const survey = await prisma.survey.findUnique({
      where: {
        id: surveyId,
        businessId: business.id, // Ensure the survey belongs to this business
      },
    });

    if (!survey) {
      return {
        error: "Survey not found or you don't have permission to delete it.",
      };
    }

    // Delete the survey (cascading delete will handle related records)
    await prisma.survey.delete({
      where: { id: surveyId },
    });

    return {
      success: true,
      message: "Survey deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting survey:", error);
    return {
      error: "Failed to delete survey. Please try again.",
    };
  }
}
