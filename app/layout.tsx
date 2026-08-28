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
  title: "Note di Fede — Musica per l'anima, parole per il cuore",
  description: "Musica per l'anima, parole per il cuore: canti liturgici, celebrazioni, liturgia delle ore, Bibbia e meditazioni sulla Parola.",
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
    title: "Note di Fede — Musica per l'anima, parole per il cuore",
    description: "Musica per l'anima, parole per il cuore: canti liturgici, celebrazioni, liturgia delle ore e meditazioni sulla Parola.",
    siteName: "Note di Fede",
  },
};




import { ServiceWorkerRegister } from "@/components/service-worker-register";

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
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}

