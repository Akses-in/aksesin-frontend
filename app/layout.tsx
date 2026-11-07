import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const roboto = localFont({ src: "./fonts/roboto.woff2", weight: "400 700", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Aksesin", template: "%s · Aksesin" },
  description: "Buat akun Aksesin dan atur preferensi aksesibilitas sesuai kebutuhanmu.",
  icons: { icon: "/figma/register-aksesin-mark.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={roboto.className}>
      <body>{children}</body>
    </html>
  );
}
