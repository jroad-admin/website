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
        <div className="hero-lockup">
          <h1 className="hero-wordmark"><img src="/assets/jroad-wordmark.png" width="217" height="33" alt="JROAD" fetchPriority="high" /></h1>
          <p className="tagline">Architecture Design Studio</p>
          <div className="hero-contact">{site.phone && <a href={phone}>{site.phone}</a>}{site.email && <a href={email}>{site.email}</a>}</div>
          <a className="down" href="#work" aria-label="View work" />
        </div>
      </section>
      <section id="work" className="work wrap home-work" aria-label="Work"><Gallery projects={projects} categories={categories} /></section>
    </main>
    <SiteFooter>
      <div className="home-studio">
        <div id="about"><p className="eyebrow">Studio</p><p>{site.about}</p></div>
        <div id="contact"><p className="eyebrow">Enquiries</p>
          {site.address && <p>{site.address}</p>}
          {site.email && <a href={email}>{site.email}</a>}
          {site.phone && <a href={phone}>{site.phone}</a>}
        </div>
      </div>
    </SiteFooter>
  </>;
}
