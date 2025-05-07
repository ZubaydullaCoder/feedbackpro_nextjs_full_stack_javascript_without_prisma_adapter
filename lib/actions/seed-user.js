"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Creates a test business owner user for development purposes
 * @returns {Promise<Object>} - Result object with success/error information
 */
export async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    });

    if (existingUser) {
      return {
        success: true,
        message: "Test user already exists",
        userId: existingUser.id,
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        hashedPassword,
        role: "BUSINESS_OWNER",
        isActive: true,
      },
    });

    return {
      success: true,
      message: "Test user created successfully",
      userId: user.id,
    };
  } catch (error) {
    console.error("Error creating test user:", error);
    return {
      error: "Failed to create test user",
    };
  }
}
