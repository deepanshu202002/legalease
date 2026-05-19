import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LegalEase — AI Contract Analysis",
  description:
    "Instantly analyze any contract with AI. Get a risk score, plain-English insights, and actionable recommendations in seconds.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0d0a08" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navbar />
        <main style={{ minHeight: "calc(100vh - 64px)" }}>{children}</main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(20,14,10,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#f5f5f5",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
