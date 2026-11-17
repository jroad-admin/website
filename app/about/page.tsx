import type { Metadata } from "next";
import { initialSettings, readSite } from "../../lib/content";
import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata: Metadata = { title: "About — JROAD" };
export const dynamic = "force-dynamic";

export default async function About() {
  const { settings } = await readSite();
  const site = settings ?? initialSettings;
  return <>
    <SiteHeader instagram={site.instagram} current="/about" />
    <main className="wrap interior">
      <h1>About</h1>
      <p className="studio-copy">{site.about}</p>
    </main>
    <SiteFooter />
  </>;
}
