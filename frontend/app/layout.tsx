import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fefe Ave",
  description:
    "Live sales. Fabulous finds in clothes and shoes from Felicia's Fefe Ave — started on Instagram Live, now mainly on Whatnot.",
  icons: {
    icon: "/fefe-bird-icon.png",
    apple: "/fefe-bird-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
