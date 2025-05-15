/**
 * Configuration for Auth.js that can be serialized for the Edge runtime
 * Used by middleware and other edge-compatible code
 */

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login", // Error page for auth errors
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isActive = auth?.user?.isActive;

      // Log the state for debugging redirects
      // console.log(`[Auth Middleware] Path: ${pathname}`);
      // console.log(`[Auth Middleware] isLoggedIn: ${isLoggedIn}`);
      // console.log(`[Auth Middleware] isActive: ${isActive}`);
      // console.log(`[Auth Middleware] User:`, auth?.user);

      // Protected routes that require authentication
      const isProtectedRoute =
        pathname.startsWith("/dashboard") || pathname.startsWith("/surveys");

      // Auth routes that should not be accessible when authenticated
      const isAuthRoute =
        pathname.startsWith("/login") || pathname.startsWith("/register");

      // Admin routes protection
      const isAdminRoute = pathname.startsWith("/admin");

      // Redirect unauthenticated users from protected routes to login
      if (isProtectedRoute && (!isLoggedIn || !isActive)) {
        // console.log(
        //   `[Auth Middleware] Denying access to ${pathname}. Redirecting to login.`
        // );
        return false;
      }

      // For auth routes, redirect to dashboard if user is logged in
      if (isAuthRoute && isLoggedIn && isActive) {
        return Response.redirect(new URL("/dashboard", request.url));
      }

      // Redirect non-admin users from admin routes
      if (
        isAdminRoute &&
        (!isLoggedIn || auth.user.role !== "ADMIN" || !isActive)
      ) {
        console.log(
          `[Auth Middleware] Denying access to ${pathname} (Admin). Redirecting.`
        );
        return false;
      }

      return true;
    },
  },
  trustHost: true,
  session: { strategy: "jwt" },
};
