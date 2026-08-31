import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { KeyVaultProvider } from "@/lib/byok/key-vault";
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
  title: "OmniEval — Multi-Model LLM Benchmarking",
  description:
    "Compare OpenAI, Anthropic, Gemini, and Groq models head-to-head with bring-your-own-key security.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <KeyVaultProvider>{children}</KeyVaultProvider>
      </body>
    </html>
  );
}
