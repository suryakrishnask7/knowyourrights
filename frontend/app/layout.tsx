import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KnowYourRights — Statutory Legal Instrument & Archive",
  description:
    "Grounded Indian statutory research interface for Tamil Nadu, Maharashtra, and Karnataka labour and tenancy law.",
  keywords: ["Indian law", "statutory rights", "labour legislation", "POSH Act", "Payment of Wages"],
};

// Injected before React hydration to prevent flash of wrong theme.
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('kyr-theme');
    var theme = stored || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <head>
        {/* Prevents theme flash on load */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

