import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Header, Footer } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "East Coast Car Rentals",
  description: "Search vehicle availability, make a booking and manage its cancellation in this rental assessment demo.",
};

// The shared shell stays server-rendered; nesting interactive forms does not
// require turning the layout or its pages into Client Components.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body>
        <a href="#main-content" className="skip-link button button-secondary">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
