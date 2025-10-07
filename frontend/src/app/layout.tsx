import "@/index.css";

export const metadata = {
  title: "Resona Sound Studio Hub",
  description: "Studio de production audio professionnel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}
