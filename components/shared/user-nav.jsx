"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth.actions";

export default function UserNav({ user }) {
  const router = useRouter();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const { name, email, image } = user;

  // Get first letter of name or email
  const fallbackText = name
    ? name.charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      // Show loading toast
      toast({
        title: "Signing out...",
        description: "Please wait while we sign you out.",
      });

      const result = await logout();

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error || "There was a problem signing out.",
          variant: "destructive",
        });
      } else {
        // Success toast
        toast({
          title: "Signed out",
          description: "You have been signed out successfully.",
        });

        // Handle redirect on the client side
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500); // Short delay to allow toast to be seen
      }
    } catch (error) {
      // Only show error toast for actual errors
      console.error("Sign out error:", error);
      toast({
        title: "Error",
        description: "There was a problem signing out.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          {image && <AvatarImage src={image} alt={name || email} />}
          <AvatarFallback>{fallbackText}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {name && <p className="font-medium">{name}</p>}
            {email && <p className="text-sm text-muted-foreground">{email}</p>}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
