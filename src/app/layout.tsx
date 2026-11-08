import type { Metadata } from "next";
import "@fontsource/heebo/400.css";
import "@fontsource/heebo/600.css";
import "@fontsource/heebo/700.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Bottomline | מעבדת התוכן",
  description: "סביבת ניסוי אישית לתכנון וכתיבת תוכן. אין פרסום אוטומטי.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
