import Link from "next/link";
import type { ReactNode } from "react";

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

export function SiteFooter({ children }: { children?: ReactNode }) {
  return <footer className="wrap">
    {children}
    <div className="footer-links">
      <Link href="/"><img className="footer-logo" src="/assets/jroad-whale.jpg" width="112" height="78" alt="JROAD home" /></Link>
      <Link href="/portal">Editor portal</Link>
    </div>
  </footer>;
}
