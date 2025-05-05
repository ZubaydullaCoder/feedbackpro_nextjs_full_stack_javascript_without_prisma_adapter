"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { signIn } from "next-auth/react"; // Import signIn directly from next-auth/react
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export default function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    // Reset Google account state on new submission
    setIsGoogleAccount(false);
    try {
      // Show loading toast
      toast({
        title: "Signing in...",
        description: "Please wait while we verify your credentials.",
      });

      // Call signIn directly with credentials
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false, // Don't redirect automatically so we can handle errors
      });

      if (result?.error) {
        // Determine the appropriate error message
        console.log("Login error:", result.error);
        let errorTitle = "Authentication failed";
        let errorDescription = "Please check your credentials and try again.";

        // Check for specific error types
        if (result.error === "CredentialsSignin") {
          errorDescription = "Invalid email or password.";
          setIsGoogleAccount(false);
        } else if (result.error.includes("Configuration")) {
          errorTitle = "Google Account Detected";
          errorDescription =
            "This email is linked to a Google account. Please use the 'Sign in with Google' button below.";
          // Set the Google account flag to highlight the button
          setIsGoogleAccount(true);
        } else {
          setIsGoogleAccount(false);
        }

        // Show the error toast
        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        // Authentication successful
        toast({
          title: "Success!",
          description: "You successfully logged in",
        });

        // Navigate to dashboard after successful login
        // We don't set isLoading to false here to keep the form disabled during redirect
        router.push(result?.url || "/dashboard");

        // The form will remain in loading state until the page changes
        // This prevents users from clicking again during the redirect
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Something went wrong",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // Reset Google account state
    setIsGoogleAccount(false);
    try {
      toast({
        title: "Signing in with Google...",
        description: "You will be redirected to Google's sign-in page.",
      });

      // Call signIn directly with Google provider
      // This will automatically redirect to Google's auth page
      await signIn("google", { callbackUrl: "/dashboard" });

      // Note: The code below will only run if the redirect doesn't happen immediately
      // We intentionally don't reset loading state to keep the form disabled
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast({
        title: "Something went wrong",
        description: "There was an error signing in with Google.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <div className="flex items-center">
        <Separator className="flex-1" />
        <span className="mx-2 text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button
        variant={isGoogleAccount ? "default" : "outline"}
        className={`w-full ${isGoogleAccount ? "animate-pulse border-2 border-primary" : ""}`}
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg
          className="mr-2 h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        Sign in with Google
      </Button>

      {isGoogleAccount && (
        <div className="text-center text-sm text-primary font-medium mt-2">
          ↑ Use this button to sign in with your Google account ↑
        </div>
      )}

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Register
        </Link>
      </div>
    </div>
  );
}
