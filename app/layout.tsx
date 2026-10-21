import type { Metadata } from "next";
import { Archivo, Patrick_Hand_SC } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"] });
const hand = Patrick_Hand_SC({ variable: "--font-hand-sc", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "Admin | At 116 & Broadway",
  description: "Admin area for At 116 & Broadway. Superadmins only.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${hand.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
