import { createApp } from '../../server/app';
import { createD1Db } from '../../server/db/d1';

/**
 * Cloudflare Pages Functions entry — mounts the SAME portable Hono app as
 * the Workers/VPS entries, backed by the Pages project's D1 binding.
 * File-based routing: this handles all `/api/*` requests same-origin, so
 * HttpOnly session cookies keep working with no CORS needed.
 *
 * Required Pages binding: D1 database bound as variable name `DB`
 * (Pages dashboard → project → Settings → Bindings, or wrangler config).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function onRequest(context: any): Promise<Response> {
  if (!context.env?.DB) {
    return Response.json({ error: 'database_not_configured' }, { status: 503 });
  }
  const app = createApp(createD1Db(context.env.DB));
  return app.fetch(context.request, context.env);
}
