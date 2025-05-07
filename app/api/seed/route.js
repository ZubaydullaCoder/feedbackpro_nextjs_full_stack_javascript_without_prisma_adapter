import { NextResponse } from "next/server";
import { createTestUser } from "@/lib/actions/seed-user";

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    const result = await createTestUser();

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in seed endpoint:", error);
    return NextResponse.json(
      { error: "Failed to seed test user" },
      { status: 500 }
    );
  }
}
