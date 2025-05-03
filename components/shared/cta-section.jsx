import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CTASection({ 
  title = "Ready to improve your customer experience?",
  description = "Join businesses that use FeedbackPro to collect honest feedback and drive growth.",
  primaryButtonText = "Get Started",
  primaryButtonHref = "/register",
  secondaryButtonText = "Contact Sales",
  secondaryButtonHref = "/contact"
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
          {title}
        </h2>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          {description}
        </p>
      </div>
      <div className="flex flex-col gap-2 min-[400px]:flex-row">
        <Link
          href={primaryButtonHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {primaryButtonText} <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
        <Link
          href={secondaryButtonHref}
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          {secondaryButtonText}
        </Link>
      </div>
    </div>
  );
}
