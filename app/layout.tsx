import type { Metadata } from "next";
import { Space_Grotesk, Literata } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/layout/nav";
import { getCurrentProfile } from "@/lib/auth";
import { getAppThemeVariables } from "@/lib/theme";
import type { CSSProperties } from "react";

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
  const themeVars = getAppThemeVariables(profile?.theme_token);
  const bodyStyle = {
    fontFamily: "var(--font-text), serif",
    ...themeVars
  } as CSSProperties;

  return (
    <html lang="en" className={`${displayFont.variable} ${textFont.variable}`}>
      <body style={bodyStyle}>
        <NavBar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  );
}
