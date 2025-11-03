import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  variable: "--font-tajawal",
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  subsets: ["latin", "arabic"],
});

export const metadata: Metadata = {
  title: "منشئ رمز QR العقاري",
  description: "أداة لإنشاء رموز QR للعقارات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${tajawal.variable} font-tajawal antialiased`}>
        {children}
      </body>
    </html>
  );
}
