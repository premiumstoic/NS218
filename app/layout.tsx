import type { Metadata } from "next";
import { Space_Grotesk, Literata } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/nav";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

const textFont = Literata({
  variable: "--font-text",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "NS218 Interactive Class Playground",
  description: "Weekly notes, flashcards, quizzes, simulations and class discussion for NS218."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable}`}>
      <body style={{ fontFamily: "var(--font-text), serif" }}>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
