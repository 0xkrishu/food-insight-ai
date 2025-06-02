import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Know Your Food - AI Food Analysis",
  description: "Upload or capture food images to get instant nutrition insights and health suggestions powered by AI.",
  keywords: "food analysis, nutrition, AI, health, diet, food recognition",
  authors: [{ name: "Krishnakumar" }],
  openGraph: {
    title: "Know Your Food - AI Food Analysis",
    description: "Get instant nutrition insights for your food using AI",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sora.className}>
      <body className="min-h-screen flex flex-col">
        {children}
        <footer className="mt-auto py-6 text-center text-gray-600 text-sm">
          Built with ❤️ by Krishnakumar | Powered by ChatGPT
        </footer>
      </body>
    </html>
  );
}
