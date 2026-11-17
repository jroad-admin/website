import type { Metadata } from "next";
import { initialSettings, readSite, readTeam } from "../../lib/content";
import { SiteFooter, SiteHeader } from "../site-chrome";

export const metadata: Metadata = { title: "About — JROAD" };
export const dynamic = "force-dynamic";

export default async function About() {
  const [{ settings }, members] = await Promise.all([readSite(), readTeam()]);
  const site = settings ?? initialSettings;
  return <>
    <SiteHeader instagram={site.instagram} current="/about" />
    <main className="wrap team-page">
      <h1 className="screen-reader-only">About the team</h1>
      <div className="team-grid">
        {members.map(member => <article className="team-profile" key={member.id}>
          <h2>{member.name}</h2>
          {member.role && <p className="team-role">{member.role}</p>}
          <img className="team-portrait" src="/assets/team-portrait.jpg" alt="" width="194" height="194" />
          {member.bio && <p className="team-bio">{member.bio}</p>}
        </article>)}
      </div>
    </main>
    <SiteFooter />
  </>;
}
