import Link from "next/link";
import { MessageSquare } from "lucide-react";
import Container from "./container";

export default function Footer() {
  return (
    <footer className="border-t border-border/40 py-6 md:py-8">
      <Container
        size="wide"
        className="flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">FeedbackPro</span>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:underline underline-offset-4">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/contact" className="hover:underline underline-offset-4">
            Contact
          </Link>
        </div>
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} FeedbackPro. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
