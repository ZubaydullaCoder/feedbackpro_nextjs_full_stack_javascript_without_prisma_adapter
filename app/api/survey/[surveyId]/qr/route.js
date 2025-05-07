import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";

/**
 * Generates a QR code for a survey
 * @param {Request} request - The request object
 * @param {Object} params - Route parameters
 * @returns {Promise<NextResponse>} - JSON response with QR code data
 */
export async function GET(request, { params }) {
  try {
    const surveyId = params.surveyId;

    // Validate surveyId format (basic check)
    if (!surveyId || typeof surveyId !== "string" || surveyId.length < 10) {
      return NextResponse.json(
        { error: "Invalid survey ID format" },
        { status: 400 }
      );
    }

    // Fetch the survey (minimal data needed)
    const survey = await prisma.survey.findUnique({
      where: {
        id: surveyId,
        status: "ACTIVE", // Only generate QR codes for active surveys
      },
      select: {
        id: true,
      },
    });

    // If survey not found or not active
    if (!survey) {
      return NextResponse.json(
        { error: "Survey not found or not active" },
        { status: 404 }
      );
    }

    // Construct the public survey URL
    const publicSurveyUrl = `${process.env.NEXTAUTH_URL}/s/${surveyId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(publicSurveyUrl, {
      margin: 1,
      scale: 8,
      errorCorrectionLevel: "M",
    });

    // Return the QR code data and URL
    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      surveyUrl: publicSurveyUrl,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
