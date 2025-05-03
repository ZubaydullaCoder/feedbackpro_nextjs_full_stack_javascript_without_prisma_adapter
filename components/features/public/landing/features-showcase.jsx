import { 
  QrCode, 
  MessageSquare, 
  BarChart4, 
  Shield, 
  Smartphone, 
  Ticket 
} from "lucide-react";
import FeatureCard from "./feature-card";

export default function FeaturesShowcase() {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Feedback",
      description: "Generate QR codes for your surveys that customers can scan to provide feedback instantly."
    },
    {
      icon: MessageSquare,
      title: "SMS Feedback",
      description: "Send unique, single-use feedback links via SMS for personalized customer outreach."
    },
    {
      icon: Ticket,
      title: "Incentive System",
      description: "Reward customers who provide feedback via SMS with discount codes to encourage participation."
    },
    {
      icon: BarChart4,
      title: "Analytics Dashboard",
      description: "View response rates, average ratings, and other key metrics to track performance."
    },
    {
      icon: Shield,
      title: "Tamper-Proof",
      description: "Ensure feedback integrity with a system that prevents businesses from altering submitted responses."
    },
    {
      icon: Smartphone,
      title: "Mobile Friendly",
      description: "Responsive design ensures a seamless experience for customers on any device."
    }
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="space-y-2">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Everything you need to collect valuable feedback
          </h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Our platform provides simple yet powerful tools to gather honest customer feedback and turn it into actionable insights.
          </p>
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </div>
  );
}
