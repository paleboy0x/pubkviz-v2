import type { Metadata } from "next";
import { Bebas_Neue, Outfit, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PubKviz — pitanja za pub kviz",
  description:
    "Kupi pub kviz pitanja po kategorijama i težini. Bez ponavljanja kroz kupnje.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hr"
      className={`dark ${bebas.variable} ${outfit.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#030304] font-sans text-[#ececf1]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-[#0c0c0e] !border !border-white/10 !text-[#ececf1] !shadow-2xl",
            },
          }}
        />
      </body>
    </html>
  );
}
