import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ghost AI",
  description: "Collaborative AI system design workspace",
};

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorBackground: "var(--bg-base)",
    colorText: "var(--text-primary)",
    colorTextSecondary: "var(--text-secondary)",
    colorInputBackground: "var(--bg-elevated)",
    colorInputText: "var(--text-primary)",
    colorPrimary: "var(--accent-primary)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    modalBackdrop: "bg-black/80 backdrop-blur-[2px]",
    modalContent: "bg-surface text-copy-primary border border-surface-border",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base text-copy-primary">
        <ClerkProvider appearance={clerkAppearance} afterSignOutUrl="/sign-in">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
