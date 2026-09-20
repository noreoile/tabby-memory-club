import type { Metadata } from "next";
import "./globals.css";
import "./room-updates.css";

export const metadata: Metadata = {
  title: "狸花俱樂部｜多人記憶配對",
  description: "邀請朋友加入 2–8 人動物記憶配對，挑戰貓咪、水獺與海獺牌組。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
