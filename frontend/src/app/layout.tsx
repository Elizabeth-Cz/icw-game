import type { Metadata } from "next";
import { Geist, Geist_Mono, Irish_Grover, Jersey_10, Jersey_25 } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "../context/SocketContext";
import { GameProvider } from "../context/GameContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const irishGrover = Irish_Grover({
  weight: ["400"],
  variable: "--font-irish-grover",
  subsets: ["latin"],
});

const jersey10 = Jersey_10({
  weight: ["400"],
  variable: "--font-jersey-10",
  subsets: ["latin"],
});

const jersey25 = Jersey_25({
  weight: ["400"],
  variable: "--font-jersey-25",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Guess Who - ICW Edition",
  description: "A real-time, two-player web application that replaces the physical Guess Who board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${irishGrover.variable} ${jersey10.variable} ${jersey25.variable} antialiased`}
      >
        <SocketProvider>
          <GameProvider>
            {children}
          </GameProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
