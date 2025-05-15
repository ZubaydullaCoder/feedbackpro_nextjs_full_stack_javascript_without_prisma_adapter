import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

/**
 * Main Auth.js configuration with providers, callbacks, and other options
 * that cannot be serialized for the Edge runtime
 *
 * IMPORTANT: The JWT callback can run in both server and browser environments.
 * We avoid using Prisma or any server-only libraries in this callback to prevent
 * "PrismaClient is unable to run in this browser environment" errors.
 *
 * For real-time user status checks, implement a separate API endpoint that can
 * be called from the client side as needed.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NEXT_AUTH_GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // If user not found
          if (!user) {
            return null; // User not found at all
          }

          // If user exists but doesn't have a password and has a Google account
          if (!user.hashedPassword && user.googleId) {
            throw new Error("GoogleAccountExists"); // Specific error for Google users trying credentials
          }

          // If user exists but doesn't have a password for some other reason
          if (!user.hashedPassword) {
            return null;
          }

          // If user is inactive
          if (!user.isActive) {
            throw new Error(
              "Your account has been deactivated. Please contact support."
            );
          }

          // Verify password
          // Note: bcryptjs compare is synchronous in browser, async on Node.js
          const passwordMatch = bcrypt.compareSync(
            credentials.password,
            user.hashedPassword
          );

          if (!passwordMatch) {
            return null;
          }

          // Return user object (will be passed to JWT callback)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            isActive: user.isActive,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, profile }) {
      // This callback runs on sign-in and whenever the session is accessed.
      // 'user', 'account', 'profile' are only available during sign-in.

      // Handle OAuth Sign-in (Google, etc.)
      if (account?.provider === "google" && profile) {
        // console.log("[JWT Callback] Processing Google sign-in...");
        try {
          // Try to find user by googleId
          let dbUser = await prisma.user.findUnique({
            where: { googleId: profile.sub },
          });

          // If not found by googleId, try to find by email
          if (!dbUser && profile.email) {
            dbUser = await prisma.user.findUnique({
              where: { email: profile.email },
            });

            if (dbUser) {
              // User exists with this email, link Google account
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  googleId: profile.sub,
                  // Update name/image if they were empty
                  name: dbUser.name || profile.name,
                  image: dbUser.image || profile.picture,
                },
              });
            } else {
              // Create new user with Google details
              dbUser = await prisma.user.create({
                data: {
                  email: profile.email,
                  name: profile.name,
                  image: profile.picture,
                  googleId: profile.sub,
                  role: "BUSINESS_OWNER",
                  isActive: true,
                },
              });
            }
          } else if (dbUser) {
            // User found by googleId, update name/image if needed
            const needsUpdate =
              (!dbUser.name && profile.name) ||
              (!dbUser.image && profile.picture);

            if (needsUpdate) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                  name: dbUser.name || profile.name,
                  image: dbUser.image || profile.picture,
                },
              });
            }
          }

          if (dbUser) {
            // Log the user object fetched/created from DB
            // console.log(
            //   "[JWT Callback - Google] Found/Created dbUser:",
            //   dbUser
            // );
            // Set token data from database user
            token.sub = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            token.role = dbUser.role;
            token.isActive = dbUser.isActive;
          }
          // Log the token state after attempting Google user processing
          // console.log("[JWT Callback - Google] Token after processing:", token);
        } catch (error) {
          console.error("JWT Google callback error:", error);
        }
      }

      // Handle Credentials Sign-in
      // The 'user' object is passed from the 'authorize' callback on successful credentials login.
      if (account?.provider === "credentials" && user) {
        // console.log("[JWT Callback] Processing Credentials sign-in...");
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = user.role;
        token.isActive = user.isActive;
      }

      // Log the final token being returned by the JWT callback
      // console.log("[JWT Callback] Returning token:", token);

      // We'll rely on the initial token data for user status
      // This avoids Prisma queries in the JWT callback which can run in the browser
      // For real-time status updates, implement a separate API endpoint that can be called client-side

      return token;
    },

    async session({ session, token }) {
      // Log the token received by the session callback
      // console.log("[Session Callback] Received token:", token);
      if (token) {
        // console.log("[Session Callback] Assigning properties to session.user");
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      // Log the session object being returned
      // console.log("[Session Callback] Returning session:", session);
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});
