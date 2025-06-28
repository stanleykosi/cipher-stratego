/**
 * @description
 * This is the root layout for the Next.js application. It sets up the basic HTML
 * structure, including fonts, global styles, and the main application shell.
 *
 * I have modified this file to:
 * 1. Import and render the new `Header` component.
 * 2. Structure the `body` with a flex column layout to create a sticky header
 *    and a main content area that fills the remaining space.
 * 3. Wrap the application's content with the `WalletContextProvider` to make
 *    Solana wallet context available to all components.
 *
 * @dependencies
 * - `next/font`: For font optimization.
 * - `./globals.css`: For global styles.
 * - `./providers`: The component that houses all wallet-related context providers.
 * - `@/app/_components/header`: The newly created header component.
 *
 * @notes
 * By encapsulating providers in `providers.tsx` and the header in its own component,
 * this `layout.tsx` remains a Server Component, which is a Next.js App Router best practice.
 */
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { WalletContextProvider } from "./providers";
import { Header } from "@/app/_components/header";
import "./globals.css";

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Cipher Stratego",
  description: "An on-chain hidden information game built with Arcium.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <WalletContextProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}