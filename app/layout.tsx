import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales Pipeline",
  description: "Local small business website sales pipeline"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
