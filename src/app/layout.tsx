import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "UsUnse — K-pop Destiny Revealed",
  description:
    "Discover which K-pop idol is written in your stars. Korean Saju (Four Pillars of Destiny) compatibility for global fans.",
  keywords: ["saju", "kpop", "destiny", "compatibility", "BTS", "BLACKPINK", "korean astrology"],
  openGraph: {
    title: "UsUnse — Which K-pop idol is your destiny?",
    description: "Find your K-pop soulmate through ancient Korean astrology.",
    url: "https://usunse.com",
    siteName: "UsUnse",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "UsUnse — Which K-pop idol is your destiny?",
    description: "Find your K-pop soulmate through ancient Korean astrology.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
