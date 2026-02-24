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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

import { PwaUpdater } from "@/components/PwaUpdater";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <PwaUpdater />
        {children}
      </body>
    </html>
  );
}
