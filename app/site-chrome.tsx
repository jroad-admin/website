import Link from "next/link";
import type { Settings } from "../lib/content";

export function InstagramLink({ href }: { href: string }) {
  return <a href={href} className="instagram-link" aria-label="J Road on Instagram"
    target="_blank" rel="noopener noreferrer">
    <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  </a>;
}

export function SiteHeader({ instagram, current }: { instagram?: string; current: string }) {
  return <header className="masthead"><nav aria-label="Main navigation">
    {[
      ["/", "Home"], ["/work", "Work"], ["/about", "About"], ["/contact", "Contact"],
    ].map(([href, label]) => (
      <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>
    ))}
    {instagram && <InstagramLink href={instagram} />}
  </nav></header>;
}

export function SiteFooter({ site }: { site: Settings }) {
  return <footer className="wrap">
    <div className="footer-details">
      <div id="about">
        <Link href="/" className="footer-whale-compact">
          <img className="footer-logo" src="/assets/jroad-whale.jpg" width={52} height={36} alt="JROAD home" />
        </Link>
        <p>{site.about}</p>
      </div>
      <div id="contact">
        <p className="eyebrow">Enquiries</p>
        {site.address && <p>{site.address}</p>}
        {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
        {site.phone && <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>{site.phone}</a>}
      </div>
    </div>
    <div className="footer-links"><Link href="/portal">Editor portal</Link></div>
  </footer>;
}
