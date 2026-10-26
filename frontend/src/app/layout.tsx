import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { RegisterServiceWorker } from "./register-service-worker";
import { Providers } from "./providers";

const inter = localFont({
  variable: "--font-inter",
  src: "../assets/fonts/inter-latin.woff2",
  weight: "400 600",
  display: "swap",
});

const interTight = localFont({
  variable: "--font-inter-tight",
  src: "../assets/fonts/inter-tight-latin.woff2",
  weight: "700 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UMSSY",
  description: "Plataforma de talleres y pases para Titulados UMSSY",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UMSSY",
  },
  icons: {
    icon: "/icons/icon-umssy.svg",
    apple: "/icons/icon-umssy.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0B1F2E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <RegisterServiceWorker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
