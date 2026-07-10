import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowYourRights — Indian Labour Law Guide",
  description:
    "Get grounded, cited answers about your labour rights in Tamil Nadu, Maharashtra, and Karnataka. Powered by real Indian legislation.",
  keywords: ["Indian labour law", "workers rights", "employment law India", "POSH", "wrongful termination"],
  openGraph: {
    title: "KnowYourRights",
    description: "Jurisdiction-aware Indian labour law information, powered by real legislation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
