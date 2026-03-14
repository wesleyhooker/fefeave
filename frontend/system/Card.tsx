import type { HTMLAttributes, ReactNode } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** Use "elevated" for default soft shadow; "flat" for border-only. */
  variant?: "elevated" | "flat";
};

/**
 * Card: 12px radius, soft shadow, 24px padding.
 * Use for feature blocks, trust items, and content sections.
 */
export function Card({
  variant = "elevated",
  className = "",
  children,
  ...props
}: CardProps) {
  const variantClasses =
    variant === "elevated"
      ? "bg-white shadow-fefe-card"
      : "bg-white border border-fefe-stone";
  return (
    <div
      className={`rounded-fefe-card p-fefe-3 ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = { children: ReactNode; className?: string };
export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return <div className={`mb-fefe-2 ${className}`}>{children}</div>;
}

export type CardTitleProps = {
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
  className?: string;
};
export function CardTitle({
  children,
  as: Tag = "h3",
  className = "",
}: CardTitleProps) {
  return (
    <Tag
      className={`font-fefe-heading text-xl font-semibold text-fefe-charcoal ${className}`}
    >
      {children}
    </Tag>
  );
}

export type CardBodyProps = { children: ReactNode; className?: string };
export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div
      className={`text-fefe-charcoal/90 font-fefe leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
}

export type CardFooterProps = { children: ReactNode; className?: string };
export function CardFooter({ children, className = "" }: CardFooterProps) {
  return <div className={`mt-fefe-3 ${className}`}>{children}</div>;
}
