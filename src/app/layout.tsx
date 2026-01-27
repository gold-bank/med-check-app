import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "약복용 스케줄",
  description: "매일 복용 기록하기",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "약복용 스케줄",
  },
  openGraph: {
    title: "약복용 스케줄",
    description: "매일 복용 기록하기",
    url: "https://med-check-app.vercel.app",
    type: "website",
    images: ["/pill-icon.png"],
  },
  icons: {
    icon: "/pill-icon.png",
    apple: "/pill-icon.png",
  },
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
