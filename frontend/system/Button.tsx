import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-fefe-gold text-white border-transparent hover:bg-fefe-gold-hover focus-visible:ring-2 focus-visible:ring-fefe-gold focus-visible:ring-offset-2",
  secondary:
    "bg-white text-fefe-charcoal border border-fefe-stone hover:bg-fefe-cream focus-visible:ring-2 focus-visible:ring-fefe-stone focus-visible:ring-offset-2",
  tertiary:
    "bg-transparent text-fefe-charcoal border-transparent hover:text-fefe-gold hover:underline focus-visible:ring-2 focus-visible:ring-fefe-stone focus-visible:ring-offset-2",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

const baseClasses =
  "inline-flex items-center justify-center gap-fefe-1 rounded-fefe-button font-medium font-fefe transition-colors disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
