"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateVerifiedUniqueDiscountCode } from "@/lib/utils/generateDiscountCode";

// Schema for generating and assigning a discount code
const generateDiscountCodeSchema = z.object({
  responseEntityId: z.string().cuid("Invalid response entity ID"),
  businessId: z.string().cuid("Invalid business ID"),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"], {
    required_error: "Discount type is required",
  }),
  discountValue: z.number().positive("Discount value must be positive"),
  expiresAt: z.date().optional(),
});

/**
 * Generates and assigns a discount code to a response entity
 * @param {Object} data - The discount code data
 * @returns {Promise<Object>} - The result of the operation
 */
export async function generateAndAssignDiscountCode(data) {
  try {
    console.log("generateAndAssignDiscountCode called with data:", data);

    // Validate input data
    const validatedData = generateDiscountCodeSchema.safeParse(data);
    if (!validatedData.success) {
      console.error("Validation failed:", validatedData.error.flatten());
      return {
        error: "Validation failed",
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    const {
      responseEntityId,
      businessId,
      discountType,
      discountValue,
      expiresAt,
    } = validatedData.data;
    console.log("Validated data:", {
      responseEntityId,
      businessId,
      discountType,
      discountValue,
      expiresAt,
    });

    // Verify ResponseEntity exists and is COMPLETED
    const responseEntity = await prisma.responseEntity.findUnique({
      where: {
        id: responseEntityId,
        status: "COMPLETED",
      },
      include: {
        discountCode: {
          select: { id: true },
        },
      },
    });

    console.log("Found response entity:", responseEntity);

    if (!responseEntity) {
      console.error("Response entity not found or not completed");
      return {
        error: "Response entity not found or not completed",
      };
    }

    // Check if a discount code already exists for this response entity
    if (responseEntity.discountCode) {
      console.log("Discount code already exists:", responseEntity.discountCode);
      return {
        error: "Discount code already exists for this response entity",
        discountCode: responseEntity.discountCode,
      };
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true },
    });

    if (!business) {
      return {
        error: "Business not found",
      };
    }

    // Generate a unique discount code
    const code = await generateVerifiedUniqueDiscountCode(prisma, 8, "SAVE");

    // Create a new DiscountCode record
    const discountCode = await prisma.discountCode.create({
      data: {
        code,
        discountType,
        discountValue,
        expiresAt,
        responseEntityId,
        businessId,
      },
    });

    return {
      success: true,
      discountCode,
    };
  } catch (error) {
    console.error("Error generating discount code:", error);
    return {
      error: "Failed to generate discount code",
    };
  }
}

// Schema for getting discount codes for a business
const getDiscountCodesSchema = z.object({
  businessId: z.string().cuid("Invalid business ID"),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  status: z
    .enum(["all", "active", "redeemed", "expired"])
    .optional()
    .default("all"),
});

/**
 * Gets discount codes for a business
 * @param {Object} data - The request data
 * @returns {Promise<Object>} - The result of the operation
 */
export async function getDiscountCodesForBusiness(data) {
  try {
    // Get authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session || !session.user || session.user.role !== "BUSINESS_OWNER") {
      return {
        error: "Unauthorized. Only business owners can access discount codes.",
      };
    }

    // Validate input data
    const validatedData = getDiscountCodesSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        error: "Validation failed",
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    const { businessId, page, limit, status } = validatedData.data;

    // Find the business for this user
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!business) {
      return {
        error: "Business not found or you don't have access to it",
      };
    }

    // Build the where clause based on status filter
    const where = { businessId };

    if (status === "active") {
      where.isRedeemed = false;
      where.OR = [{ expiresAt: { gt: new Date() } }, { expiresAt: null }];
    } else if (status === "redeemed") {
      where.isRedeemed = true;
    } else if (status === "expired") {
      where.isRedeemed = false;
      where.expiresAt = { lt: new Date() };
    }

    // Get total count for pagination
    const totalCount = await prisma.discountCode.count({ where });

    // Get discount codes with pagination
    const discountCodes = await prisma.discountCode.findMany({
      where,
      include: {
        responseEntity: {
          select: {
            id: true,
            type: true,
            phoneNumber: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      discountCodes,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    console.error("Error getting discount codes:", error);
    return {
      error: "Failed to get discount codes",
    };
  }
}

// Schema for redeeming a discount code
const redeemDiscountCodeSchema = z.object({
  code: z.string().min(1, "Discount code is required"),
  businessId: z.string().cuid("Invalid business ID"),
});

/**
 * Redeems a discount code
 * @param {Object} data - The request data
 * @returns {Promise<Object>} - The result of the operation
 */
export async function redeemDiscountCode(data) {
  try {
    // Get authenticated user
    const session = await auth();

    // Check if user is authenticated and is a business owner
    if (!session || !session.user || session.user.role !== "BUSINESS_OWNER") {
      return {
        error: "Unauthorized. Only business owners can redeem discount codes.",
      };
    }

    // Validate input data
    const validatedData = redeemDiscountCodeSchema.safeParse(data);
    if (!validatedData.success) {
      return {
        error: "Validation failed",
        details: validatedData.error.flatten().fieldErrors,
      };
    }

    const { code, businessId } = validatedData.data;

    // Find the business for this user
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!business) {
      return {
        error: "Business not found or you don't have access to it",
      };
    }

    // Find the discount code
    const discountCode = await prisma.discountCode.findFirst({
      where: {
        code,
        businessId,
      },
    });

    if (!discountCode) {
      return {
        error: "Discount code not found",
      };
    }

    // Check if the code is already redeemed
    if (discountCode.isRedeemed) {
      return {
        error: "Discount code has already been redeemed",
        discountCode,
      };
    }

    // Check if the code is expired
    if (discountCode.expiresAt && discountCode.expiresAt < new Date()) {
      return {
        error: "Discount code has expired",
        discountCode,
      };
    }

    // Update the discount code
    const updatedDiscountCode = await prisma.discountCode.update({
      where: { id: discountCode.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
      },
    });

    return {
      success: true,
      message: "Discount code redeemed successfully",
      discountCode: updatedDiscountCode,
    };
  } catch (error) {
    console.error("Error redeeming discount code:", error);
    return {
      error: "Failed to redeem discount code",
    };
  }
}
