import Container from "@/components/shared/container";
import HeroSection from "@/components/features/public/landing/hero-section";
import FeaturesShowcase from "@/components/features/public/landing/features-showcase";
import CTASection from "@/components/shared/cta-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 xl:py-48 bg-background"
      >
        <HeroSection />
      </Container>

      {/* Features Section */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 bg-muted/40"
      >
        <FeaturesShowcase />
      </Container>

      {/* CTA Section */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 border-t border-border/40"
      >
        <CTASection />
      </Container>
    </div>
  );
}
