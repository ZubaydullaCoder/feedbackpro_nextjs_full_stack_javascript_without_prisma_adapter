import Link from "next/link";
import { MessageSquare } from "lucide-react";
import Container from "./container";
import UserNav from "./user-nav";

export default function Header({ session }) {
  const isAuthenticated = session?.user?.isActive;

  return (
    <header className="border-b border-border/40">
      <Container size="wide" className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <span className="text-xl font-semibold">FeedbackPro</span>
        </Link>
        <nav className="flex gap-6 items-center">
          <Link
            href="/features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Pricing
          </Link>

          {isAuthenticated ? (
            <UserNav user={session.user} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium hover:underline underline-offset-4"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </Container>
    </header>
  );
}
