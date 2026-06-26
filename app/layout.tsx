import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Saira_Condensed } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const saira = Saira_Condensed({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-saira",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jbMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
  applicationName: "Gulfport Demo Look-Ahead",
  title: "Gulfport Demo Look-Ahead",
  description:
    "10-day go/no-go weather read for vessel demos at the Gulf Test Range, Gulfport MS.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Look-Ahead",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1b24",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${saira.variable} ${inter.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
