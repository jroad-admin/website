import type { Metadata } from "next";
import { categories, initialSettings, readSite } from "../../lib/content";
import Gallery from "../gallery";
import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata: Metadata = { title: "Work — JROAD" };
export const dynamic = "force-dynamic";

export default async function Work() {
  const { projects, settings } = await readSite();
  const site = settings ?? initialSettings;
  return <>
    <SiteHeader instagram={site.instagram} current="/work" />
    <main className="wrap interior">
      <h1>Work</h1>
      <Gallery projects={projects} categories={categories} />
    </main>
    <SiteFooter site={site} />
  </>;
}
