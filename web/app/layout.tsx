import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resume match checker | rezoooo.me",
    template: "%s | rezoooo.me",
  },
  description:
    "rezoooo.me compares your resume against any job description and gives you a transparent 0-100 match score, keyword gaps, and fixes ranked by impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] antialiased">
        {children}
      </body>
    </html>
  );
}
