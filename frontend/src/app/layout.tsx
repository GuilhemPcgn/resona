import "@/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resona Sound Studio Hub",
  description: "Studio de production audio professionnel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
