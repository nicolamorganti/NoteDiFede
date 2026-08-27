import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#5c4a37",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://note-di-fede.vercel.app"),
  title: "Note di Fede - Portale Coro",
  description: "Archivio e gestione canti, celebrazioni e spartiti liturgici.",
  applicationName: "Note di Fede",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Note di Fede",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "Note di Fede",
    description: "Archivio e gestione canti, celebrazioni e spartiti liturgici.",
    siteName: "Note di Fede",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
