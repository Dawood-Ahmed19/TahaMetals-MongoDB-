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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
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
