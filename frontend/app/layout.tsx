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
};

// Injected before React hydration to prevent flash of wrong theme.
const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('kyr-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e){}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevents theme flash on load */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
