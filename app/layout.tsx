import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./style.css";

export const metadata: Metadata = {
  title: "JROAD — Architecture Design Studio",
  description: "JROAD architecture design studio in Auckland, New Zealand.",
  icons: { icon: "/assets/favicon.jpg" },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en-NZ"><body>{children}</body></html>;
}
