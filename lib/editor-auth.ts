import { createRemoteJWKSet, jwtVerify } from "jose";

let remoteKeys: ReturnType<typeof createRemoteJWKSet> | undefined;
export async function editorIdentity(headers: Headers) {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN?.replace(/\/$/, "");
  const audience = process.env.CF_ACCESS_AUDIENCE;
  const token = headers.get("cf-access-jwt-assertion");
  if (!teamDomain || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(teamDomain) || !audience || !token) return null;
  try {
    remoteKeys ??= createRemoteJWKSet(new URL("/cdn-cgi/access/certs", teamDomain));
    const { payload } = await jwtVerify(token, remoteKeys, {
      issuer: teamDomain, audience, algorithms: ["RS256"], requiredClaims: ["exp", "sub"],
    });
    return typeof payload.email === "string" && payload.type === "app" ? payload.email : null;
  } catch {
    return null;
  }
}

export function editorSecret() {
  const secret = process.env.WEBSITE_EDITOR_SECRET;
  if (!secret || secret.length < 32) throw new Error("Editor backend is not configured.");
  return secret;
}
