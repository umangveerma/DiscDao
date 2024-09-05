"use client";

import { DM_Sans } from "next/font/google";
import { Space_Mono } from "next/font/google";
import { SolanaWalletProvider } from "@/components/SolanaWalletProvider";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import "./globals.css";

const fontHeading = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-heading",
});

const fontBody = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "DiscDao",
  description: "Vote And Earn Community Reputation NFT",
  other: {
    "dscvr:canvas:version": "vNext",
    "og:image": "https://mike-honest-well-corners.trycloudflare.com/og.png",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={cn("antialiased", fontHeading.variable, fontBody.variable)}
      >
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
