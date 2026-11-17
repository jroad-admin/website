"use client";

import type { FormEvent } from "react";

export default function ContactForm({ email }: { email: string }) {
  function openEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const name = [fields.get("firstName"), fields.get("lastName")].join(" ").trim();
    const subject = String(fields.get("subject") || "Website enquiry").trim();
    const body = [String(fields.get("message") ?? "").trim(), "", name, String(fields.get("email") ?? "")].join("\r\n");
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return <form className="enquiry-form" method="post" onSubmit={openEmail}>
    <h2>Send us an enquiry</h2>
    <label>First name <span aria-hidden="true">*</span><input name="firstName" autoComplete="given-name" maxLength={80} required /></label>
    <label>Last name <span aria-hidden="true">*</span><input name="lastName" autoComplete="family-name" maxLength={80} required /></label>
    <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
    <label>Subject<input name="subject" maxLength={120} /></label>
    <label className="enquiry-wide">Message <span aria-hidden="true">*</span><textarea name="message" rows={5} maxLength={1000} required /></label>
    <div className="enquiry-wide"><button type="submit">Open email draft</button></div>
  </form>;
}
