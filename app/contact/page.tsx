import type { Metadata } from "next";
import { initialSettings, readSite } from "../../lib/content";
import { InstagramLink, SiteFooter, SiteHeader } from "../site-chrome";
import ContactForm from "./contact-form";

export const metadata: Metadata = { title: "Contact — JROAD" };
export const dynamic = "force-dynamic";

export default async function Contact() {
  const { settings } = await readSite();
  const site = settings ?? initialSettings;
  return <>
    <SiteHeader instagram={site.instagram} current="/contact" />
    <main className="wrap contact-page">
      <h1>Contact</h1>
      <div className="contact-panel">
        <img className="contact-image" src="/assets/contact-workshop.webp" alt="Hands working with timber at a workshop bench" width="1200" height="800" />
        <div className="contact-panel-inner">
          <div className="contact-panel-details">
            {site.address && <p>{site.address}</p>}
            <p>
              {site.email && <><a href={`mailto:${site.email}`}>{site.email}</a><br /></>}
              {site.phone && <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>{site.phone}</a>}
            </p>
            {site.instagram && <InstagramLink href={site.instagram} />}
          </div>
          {site.email && <ContactForm email={site.email} />}
        </div>
      </div>
    </main>
    <SiteFooter site={site} />
  </>;
}
