import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SkipLink } from "@/components/ui/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Eventoria — GenAI Celebration & Event Planner",
  description:
    "Organize memorable weddings, birthdays, and community events with AI-powered INR budget allocations, backward timelines, vendor checklists, and personalized creative ideas.",
  keywords: [
    "event planner",
    "wedding planning",
    "birthday planner",
    "community gatherings",
    "AI event planning",
    "Gemini AI",
    "budget calculator INR",
    "event timeline",
  ],
  authors: [{ name: "Eventoria Team" }],
  openGraph: {
    title: "Eventoria — GenAI Celebration & Event Planner",
    description:
      "AI-driven event planning assistant for weddings, birthdays, and community events with budgets, timelines, and vendor checklists.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#d97706",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SkipLink targetId="main-content" />
        <Header />
        <main id="main-content" style={{ flex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
