import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investigation Card Game Sample",
  description: "A Next.js sample for a time-slot investigation card game loop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
