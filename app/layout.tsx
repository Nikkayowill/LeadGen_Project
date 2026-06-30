import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scoutline",
  description: "Local website sales pipeline and prospecting workspace"
};

const themeScript = `
(() => {
  try {
    if (window.localStorage.getItem("scoutline-theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  } catch (_) {}
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {children}
      </body>
    </html>
  );
}
