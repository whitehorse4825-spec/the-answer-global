import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Serif_JP, Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const fontEng = Cormorant_Garamond({
  variable: "--font-eng",
  subsets: ["latin"],
  weight: ["300", "400"],
});

const fontKo = Nanum_Myeongjo({
  variable: "--font-ko",
  weight: ["400", "700", "800"],
});

const fontJp = Noto_Serif_JP({
  variable: "--font-jp",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Answer",
  description: "The Answer - Decode Your Destiny",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${fontEng.variable} ${fontKo.variable} ${fontJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
