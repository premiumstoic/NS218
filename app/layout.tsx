import type { Metadata } from "next";
import { Space_Grotesk, Literata } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/nav";
import { getCurrentProfile } from "@/lib/auth";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";

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

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getCurrentProfile();
  const themeToken = profile?.theme_token ?? "sage";

  return (
    <html lang="en" data-theme={themeToken} className={`${displayFont.variable} ${textFont.variable}`}>
      <body style={{ fontFamily: "var(--font-text), serif" } as CSSProperties}>
        <NavBar profile={profile} />
        <main>{children}</main>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
