import { categories, initialSettings, readSite } from "../lib/content";
import Gallery from "./gallery";
import { SiteFooter, SiteHeader } from "./site-chrome";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { projects, settings } = await readSite();
  const site = settings ?? initialSettings;
  const email = `mailto:${site.email}`;
  const phone = `tel:${site.phone.replace(/[^+\d]/g, "")}`;
  return <>
    <SiteHeader instagram={site.instagram} current="/" />
    <main>
      <section id="home" className="hero wrap">
        <div><h1>JROAD</h1><p className="tagline">Architecture Design Studio</p>
          <div className="hero-contact">{site.phone && <a href={phone}>{site.phone}</a>}{site.email && <a href={email}>{site.email}</a>}</div>
          <a className="down" href="#work" aria-label="View work">⌄</a>
        </div>
      </section>
      <section id="work" className="work wrap" aria-label="Work"><Gallery projects={projects} categories={categories} /></section>
      <section id="about" className="about wrap"><div><p className="eyebrow">About</p><h2>JROAD</h2><p>{site.about}</p></div></section>
      <section id="contact" className="contact wrap">
        <p className="eyebrow">Contact</p><h2>Enquiries</h2>
        <div className="contact-details"><p>{site.address}</p><p>{site.email && <a href={email}>{site.email}</a>}<br />{site.phone && <a href={phone}>{site.phone}</a>}</p></div>
      </section>
    </main>
    <SiteFooter />
  </>;
}
