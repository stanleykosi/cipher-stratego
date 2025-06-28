/**
 * @description
 * This is the root layout for the Next.js application. It sets up the basic HTML
 * structure, including fonts and global styles.
 *
 * I have modified this file to wrap the application's content with the
 * `WalletContextProvider`. This makes all the Solana wallet hooks and context
 * available to every component in the application, enabling seamless wallet
 * interactions.
 *
 * Key features:
 * - Imports the Geist font for typography.
 * - Imports global CSS for application-wide styling.
 * - Wraps the `<body>` content with the `WalletContextProvider` component.
 *
 * @dependencies
 * - `next/font`: For font optimization.
 * - `./globals.css`: For global styles.
 * - `./providers`: The newly created component that houses all wallet-related context providers.
 *
 * @notes
 * By encapsulating providers in a separate `providers.tsx` file, this `layout.tsx`
 * can remain a Server Component, which is a Next.js App Router best practice.
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletContextProvider>{children}</WalletContextProvider>
      </body>
    </html>
  );
}