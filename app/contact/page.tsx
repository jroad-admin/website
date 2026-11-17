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
    <main className="contact-page">
      <h1 className="screen-reader-only">Contact</h1>
      <div className="contact-panel">
        <img className="contact-image" src="/assets/contact-workshop.webp" alt="Hands working with timber at a workshop bench" width="1200" height="800" />
        <div className="contact-panel-details">
          <section>
            <h2>JROAD</h2>
            {site.address && <p>{site.address}</p>}
          </section>
          <section>
            <h2>Enquiries</h2>
            {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
            {site.phone && <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>{site.phone}</a>}
          </section>
        </div>
      </div>
    </main>
    <SiteFooter site={site} />
  </>;
}
