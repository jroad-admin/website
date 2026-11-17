import type { Metadata } from "next";
import { initialSettings, readSite } from "../../lib/content";
import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata: Metadata = { title: "Contact — JROAD" };
export const dynamic = "force-dynamic";

export default async function Contact() {
  const { settings } = await readSite();
  const site = settings ?? initialSettings;
  return <>
    <SiteHeader instagram={site.instagram} current="/contact" />
    <main className="wrap interior">
      <h1>Contact</h1>
      <div className="contact contact-details">
        {site.address && <p>{site.address}</p>}
        <p>
          {site.email && <><a href={`mailto:${site.email}`}>{site.email}</a><br /></>}
          {site.phone && <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>{site.phone}</a>}
        </p>
      </div>
    </main>
    <SiteFooter />
  </>;
}
