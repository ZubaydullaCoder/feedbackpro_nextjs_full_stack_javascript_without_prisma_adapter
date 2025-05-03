import { CheckCircle2 } from "lucide-react";

export default function FeatureDetail({
  icon: Icon,
  title,
  description,
  benefits = [],
  image,
  imagePosition = "right", // "right" or "left"
}) {
  const ContentSection = () => (
    <div className="flex flex-col justify-center space-y-4">
      <div className="inline-flex items-center space-x-2 rounded-md bg-primary/10 px-3 py-1 text-sm text-primary">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tighter">{title}</h2>
        <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
          {description}
        </p>
      </div>
      {benefits.length > 0 && (
        <ul className="grid gap-2">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
      {imagePosition === "left" && (
        <div className="flex items-center justify-center order-last lg:order-first">
          {image}
        </div>
      )}
      
      <ContentSection />
      
      {imagePosition === "right" && (
        <div className="flex items-center justify-center">
          {image}
        </div>
      )}
    </div>
  );
}
