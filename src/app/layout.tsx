import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EliteTrading ERP | Elite Trading",
  description:
    "Specialized architectural fenestration ERP for managing customers, projects, technical quotations, and business reports.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F7F3] text-[#25382E] antialiased">
        {children}
      </body>
    </html>
  );
}
