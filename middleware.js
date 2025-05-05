import { auth } from "./auth";
import { NextResponse } from "next/server";

// Use the auth middleware directly
export default auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/surveys/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
