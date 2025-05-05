"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import { AuthError } from "next-auth";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(formData) {
  try {
    // Validate input
    const validatedData = registerSchema.parse(formData);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return {
        error: "Email already in use. Please use a different email or sign in.",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        hashedPassword,
        role: "BUSINESS_OWNER",
        isActive: true,
      },
    });

    return { success: true, userId: user.id };
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    return { error: "Failed to create account. Please try again later." };
  }
}

// Note: We've removed the login and loginWithGoogle server actions
// as we're now calling signIn directly from the client components.
// This simplifies the code and follows NextAuth's recommended patterns.

export async function logout() {
  try {
    // Sign out without redirect - we'll handle redirect on the client
    await signOut({ redirect: false });

    // Return success response
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Failed to sign out" };
    }

    throw error;
  }
}
