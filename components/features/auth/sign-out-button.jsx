"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SignOutButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/login" });
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem signing out.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleSignOut} disabled={isLoading}>
      {isLoading ? "Signing out..." : "Sign Out"}
    </Button>
  );
}
