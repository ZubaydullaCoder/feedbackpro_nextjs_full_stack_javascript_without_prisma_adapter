import { cn } from "@/lib/utils";

export default function Container({
  children,
  className,
  size = "default", // "default", "wide", "full"
  fullWidth, // Kept for backward compatibility
  as: Component = "div",
  ...props
}) {
  // Handle legacy fullWidth prop for backward compatibility
  const containerSize = fullWidth ? "full" : size;

  return (
    <Component
      className={cn(
        // Base styles
        "w-full",
        // Size-based max-width with consistent centering
        containerSize === "default" && "max-w-[80rem] mx-auto", // 1280px
        containerSize === "wide" && "max-w-[90rem] mx-auto", // 1440px
        containerSize === "full" && "", // No max-width
        // Consistent padding always applied
        "px-4 sm:px-6 lg:px-8",
        // Custom classes
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
