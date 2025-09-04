import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "AI Twitter Agent",
  description: "24×7 AI-powered Twitter agent for community building and engagement automation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-satoshi">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
