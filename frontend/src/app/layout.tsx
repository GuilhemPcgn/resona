import "@/index.css";
import type { Metadata } from "next";
import { Providers } from "@/components/providers/Providers";

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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
