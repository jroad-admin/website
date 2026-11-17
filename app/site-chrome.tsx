import Link from "next/link";

export function SiteHeader({ instagram, current }: { instagram?: string; current: string }) {
  return <header className="masthead"><nav aria-label="Main navigation">
    {[
      ["/", "Home"], ["/work", "Work"], ["/about", "About"], ["/contact", "Contact"],
    ].map(([href, label]) => (
      <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>
    ))}
    {instagram && <a href={instagram}>Instagram</a>}
  </nav></header>;
}

export function SiteFooter() {
  return <footer className="wrap">
    <Link href="/"><img className="footer-logo" src="/assets/jroad-whale.jpg" width="112" height="78" alt="JROAD home" /></Link>
    <Link href="/portal">Editor portal</Link>
  </footer>;
}
