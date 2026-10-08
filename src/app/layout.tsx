import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Syllabus To-Do",
  description: "Turn your syllabi into a weekly to-do list.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
