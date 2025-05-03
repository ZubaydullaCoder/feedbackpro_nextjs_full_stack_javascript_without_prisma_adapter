export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-start space-y-4 rounded-lg border border-border/50 bg-background p-6 shadow-sm">
      <Icon className="h-10 w-10 text-primary" />
      <div className="space-y-2">
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
