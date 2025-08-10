import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const title = "Life Clock - Visualize Your Life's Progress in Real Time";
const description =
  "Life Clock is a real-time, CLI-style life progress monitor. Track your life's journey, set goals, and stay motivated by visualizing your time. Perfect for developers, students, and anyone looking to make the most of their time.";
const url = "https://life-clock.jomo.pro";

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  keywords: [
    "life clock",
    "progress monitor",
    "real-time clock",
    "CLI style",
    "life progress",
    "time visualization",
    "motivation tool",
    "developer tool",
    "goal tracking",
  ],
  alternates: {
    canonical: url,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url,
    title,
    description,
    images: [
      {
        url: "/screen.png",
        width: 1200,
        height: 630,
        alt: "Life Clock Screenshot",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/screen.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
