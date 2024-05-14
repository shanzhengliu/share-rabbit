import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { translation } from "./utils/translation";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rabbit Share",
  description: "Tools for share file by P2P",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
