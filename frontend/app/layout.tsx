import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--fefe-font-body",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--fefe-font-heading",
});

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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
