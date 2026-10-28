import "server-only";
import { projectId } from "@/sanity/env";

/* The Studio's Orders tool calls the site's /api/admin routes for anything
   that needs the site's own secrets (booking couriers). It sends the editor's
   Sanity login token; Sanity is asked who that is, and only an
   administrator, editor or developer of this project gets through. */
const ALLOWED_ROLES = new Set(["administrator", "editor", "developer"]);

export async function studioUser(request: Request): Promise<{ name: string; email: string } | null> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;
  try {
    const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { name?: string; email?: string; roles?: { name: string }[] };
    const allowed = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role.name));
    return allowed ? { name: user.name ?? "", email: user.email ?? "" } : null;
  } catch {
    return null;
  }
}
