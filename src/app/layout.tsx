import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const notosomeMono = Noto_Sans_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

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
  verification: {
    google: "7HFogv_3jnp93WlOKjh26rw86o8jp4SWJoOzzbrDnAY",
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
    <html lang="en" className={notosomeMono.className}>
      <body>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-9LR8JEXZ0J"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          
            gtag('config', 'G-9LR8JEXZ0J');
          `}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
