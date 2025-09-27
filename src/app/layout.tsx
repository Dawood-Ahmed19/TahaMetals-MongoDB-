"use client";

import Sidebar from "@/components/sidebar/page";
import "./globals.css";
import { usePathname } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/Login";

  return (
    <html lang="en">
      <head>
        <title>Taha Metals</title>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-BgColor font-poppins">
        <div className="flex">
          {showSidebar && <Sidebar />}
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
