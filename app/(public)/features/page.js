import Container from "@/components/shared/container";
import HeroSection from "@/components/features/public/features-page/hero-section";
import FeaturesList from "@/components/features/public/features-page/features-list";
import CTASection from "@/components/shared/cta-section";

export default function FeaturesPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 bg-background"
      >
        <HeroSection />
      </Container>

      {/* Detailed Features */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 bg-muted/40"
      >
        <FeaturesList />
      </Container>

      {/* CTA Section */}
      <Container
        as="section"
        size="default"
        className="py-12 md:py-24 lg:py-32 border-t border-border/40"
      >
        <CTASection title="Start collecting valuable feedback today" />
      </Container>
    </div>
  );
}
