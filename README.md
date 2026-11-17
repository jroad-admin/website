# JROAD website

The public launch target is `jroad.nz`. This prototype is separate from `mgmt.jroad.nz`.

Use Node.js 24 and pnpm. Run `pnpm install` and `pnpm dev` from this directory. The Next.js website is served at `http://localhost:3000`. The hosted editor is at `/portal` and requires a valid Cloudflare Access application token.

The editor can create, edit, publish, unpublish, and delete projects, replace cover images, and update the studio and contact details. Add approved assets and copy through the editor before launch.

For hosted use, connect shared storage and enforce authentication and editor membership on every editor route. Confirm the enquiry form recipient and approved site content before connecting the public domain.

## Hosted website targets

- GitHub repository: `jroad-admin/website`. It is public.
- Vercel: [J Road / website](https://vercel.com/j-road/website). GitHub reports a deployment to this project for the website repository's initial commit. That commit contains only `.gitignore` and its deployment failed. The apex `jroad.nz` responds through Vercel and redirects to `www.jroad.nz`.
- Convex project: `website`.
  - Development cloud URL: `https://industrious-capybara-49.ap-southeast-2.convex.cloud`. HTTP Actions URL: `https://industrious-capybara-49.ap-southeast-2.convex.site`.
  - Production cloud URL: `https://hushed-vulture-437.ap-southeast-2.convex.cloud`. HTTP Actions URL: `https://hushed-vulture-437.ap-southeast-2.convex.site`.
- Cloudflare R2: `jroad-prod` in account `Your Cloudflare account ID`. Set bucket-scoped object access credentials in the website's server-side environment. Scope the production bucket credentials to production.
- Editor authentication: Cloudflare Access email one-time PIN with an approved-email policy. Verify Access identity on the server for all editor operations, including uploads and publishing.

## Provider settings

Copy `.env.example` to `.env.local` for local development when connecting services. Enter production values directly in the provider dashboards.

| Vercel environment variable | Production value or source |
| --- | --- |
| `CONVEX_URL` | `https://hushed-vulture-437.ap-southeast-2.convex.cloud` |
| `WEBSITE_EDITOR_SECRET` | Unique random secret of at least 32 characters. Use the same value in this Vercel environment and its matching Convex deployment. |
| `CF_ACCESS_TEAM_DOMAIN` | The HTTPS team domain shown in Cloudflare Zero Trust, e.g. `https://your-team.cloudflareaccess.com` |
| `CF_ACCESS_AUDIENCE` | Application Audience (AUD) tag from the website editor Access application |
| `WEBSITE_ORIGIN` | `https://www.jroad.nz`, which is the current canonical host |
| `R2_ACCOUNT_ID` | `Your Cloudflare account ID` |
| `R2_BUCKET_NAME` | `jroad-prod` |
| `R2_ACCESS_KEY_ID` | R2 Access Key ID with read and write for the website bucket |
| `R2_SECRET_ACCESS_KEY` | Matching R2 Secret Access Key |

- **Convex** — set `WEBSITE_EDITOR_SECRET` individually in development and production. Deploy the functions to each target using the Convex CLI. For Vercel development or local testing, use the development Cloud URL above and a different editor secret. The HTTP Actions URLs are recorded for reference.
- **Cloudflare Access** — protect `/portal` and `/api/editor` on the canonical host with one Access application and an allowlist of approved editor emails. Enable emailed one-time PINs. The origin verifies the Access token on every editor request.
- **Cloudflare R2** — keep the bucket private and issue bucket-scoped object read/write credentials. Give development its own bucket and credentials if testing uploads there.
- **GitHub** — link the repository through the Vercel Git integration. This setup requires no GitHub secrets.

### Optional AI cover enhancement

Set `AI_IMAGE_ENHANCEMENT=true` in the website's Vercel environment to enable the enhancement button. Vercel AI Gateway uses Vercel OIDC on hosted deployments. Where OIDC is unavailable, set a server-side `AI_GATEWAY_API_KEY` for the website. The editor sends a reduced preview image to the gateway only when an authorised editor selects **Enhance with AI**. The original and enhanced versions are compared before the editor chooses what to save. Image analysis may incur AI Gateway charges.
