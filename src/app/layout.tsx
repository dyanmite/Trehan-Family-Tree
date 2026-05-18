import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

import { PasscodeGate } from "@/components/PasscodeGate";
import { AccessibilityControls } from "@/components/AccessibilityControls";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Trehan Family Tree",
  description: "Preserving Generations Together — Build your family tree, share precious memories, and stay connected across generations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <PasscodeGate>
            {children}
          </PasscodeGate>
          <AccessibilityControls />
        </ToastProvider>
      </body>
    </html>
  );
}
