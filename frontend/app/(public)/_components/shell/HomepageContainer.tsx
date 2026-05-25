import type { ContainerProps } from "@/system";
import { Container } from "@/system";
import { publicContainerMaxWidthClass } from "./publicShell";

/**
 * `Container` with editorial max-width for public header, footer, and sections.
 */
export function HomepageContainer({
  className = "",
  children,
  ...props
}: ContainerProps) {
  return (
    <Container
      className={`${publicContainerMaxWidthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Container>
  );
}
