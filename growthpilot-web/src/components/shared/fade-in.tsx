import { cn } from "@/lib/utils";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  as?: "div" | "section" | "span";
}

export function FadeIn({ children, delay = 0, duration = 400, className, as: Tag = "div" }: FadeInProps) {
  return (
    <Tag
      className={cn("animate-in fade-in slide-in-from-bottom-1 fill-mode-both", className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}
