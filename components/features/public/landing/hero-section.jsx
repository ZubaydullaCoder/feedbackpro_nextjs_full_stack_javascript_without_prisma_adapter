import Link from "next/link";
import { QrCode } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:gap-16">
      <div className="flex flex-col justify-center space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
            Collect authentic customer feedback that drives growth
          </h1>
          <p className="max-w-[600px] text-muted-foreground md:text-xl">
            Simple, impartial, and tamper-proof feedback collection via SMS and QR codes for businesses of all sizes.
          </p>
        </div>
        <div className="flex flex-col gap-2 min-[400px]:flex-row">
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Get Started
          </Link>
          <Link
            href="/features"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Learn More
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] lg:h-[500px] lg:w-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl" />
          <div className="relative h-full w-full rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-sm">
            <div className="h-full w-full rounded-lg bg-background shadow-lg flex items-center justify-center">
              <div className="p-6 space-y-4 max-w-sm">
                <div className="flex items-center gap-2">
                  <QrCode className="h-6 w-6 text-primary" />
                  <span className="font-medium">Scan & Share Feedback</span>
                </div>
                <div className="h-48 w-48 mx-auto bg-white p-4 rounded-lg flex items-center justify-center">
                  <QrCode
                    className="h-32 w-32 text-primary"
                    strokeWidth={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded-full" />
                  <div className="h-4 w-1/2 bg-muted rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
