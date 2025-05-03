import { QrCode, MessageSquare, BarChart4 } from "lucide-react";
import FeatureDetail from "./feature-detail";
import { QrCodeImage, SmsImage, AnalyticsImage } from "./feature-images";

export default function FeaturesList() {
  const features = [
    {
      icon: QrCode,
      title: "QR Code Feedback",
      description: "Create custom QR codes that link directly to your surveys. Place them in your business for customers to scan and provide feedback on the spot.",
      benefits: [
        "Printable high-resolution QR codes",
        "Unlimited scans",
        "Real-time feedback collection"
      ],
      image: <QrCodeImage />,
      imagePosition: "right"
    },
    {
      icon: MessageSquare,
      title: "SMS Feedback",
      description: "Send unique, single-use feedback links via SMS for targeted customer outreach. Perfect for following up after a service or purchase.",
      benefits: [
        "Unique, single-use links",
        "Track SMS delivery and completion status",
        "Incentivize responses with discount codes"
      ],
      image: <SmsImage />,
      imagePosition: "left"
    },
    {
      icon: BarChart4,
      title: "Analytics Dashboard",
      description: "Track response rates, average ratings, and other key metrics to understand customer satisfaction and identify areas for improvement.",
      benefits: [
        "Visual charts and graphs",
        "Response rate tracking",
        "Trend analysis over time"
      ],
      image: <AnalyticsImage />,
      imagePosition: "right"
    }
  ];

  return (
    <div className="grid gap-12 lg:gap-24">
      {features.map((feature, index) => (
        <FeatureDetail
          key={index}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          benefits={feature.benefits}
          image={feature.image}
          imagePosition={feature.imagePosition}
        />
      ))}
    </div>
  );
}
