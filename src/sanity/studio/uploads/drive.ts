import type { Item } from "./data";

/** Google Drive, through a link to a folder or photo shared as "Anyone with the link". */
const KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY ?? process.env.SANITY_STUDIO_GOOGLE_API_KEY ?? "";
export const driveReady = KEY !== "";

const API = "https://www.googleapis.com/drive/v3/files";
const FOLDER = "application/vnd.google-apps.folder";
type DriveFile = { id: string; name: string; mimeType: string; shortcutDetails?: { targetId: string; targetMimeType: string } };

/** The file or folder id in a Drive link (or a bare id). */
export function driveId(link: string) {
  const s = link.trim();
  return (s.match(/\/(?:folders|file\/d)\/([\w-]{10,})/) ?? s.match(/[?&]id=([\w-]{10,})/) ?? s.match(/^([\w-]{20,})$/))?.[1] ?? null;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}supportsAllDrives=true&key=${KEY}`);
  if (res.ok) return res.json();
  if (res.status === 404 || res.status === 403) throw new Error("Google Drive won't share it: set the folder's sharing to \"Anyone with the link\" and try again.");
  const body = await res.json().catch(() => null);
  throw new Error(body?.error?.message ?? `Google Drive answered ${res.status}`);
}

/** Every photo in the linked folder and its subfolders, under a folder named like the Drive one; or the one linked photo. */
export async function driveItems(link: string, onFound: (count: number) => void): Promise<Item[]> {
  const id = driveId(link);
  if (!id) throw new Error("That doesn't look like a Google Drive link.");
  const item = (f: { id: string; name: string }, path: string[]): Item => ({
    name: f.name,
    path,
    load: async () => {
      const res = await fetch(`${API}/${f.id}?alt=media&supportsAllDrives=true&key=${KEY}`);
      if (!res.ok) throw new Error(`Couldn't download ${f.name}`);
      return res.blob();
    },
  });

  const root = await get<DriveFile>(`${API}/${id}?fields=id,name,mimeType`);
  if (root.mimeType !== FOLDER) return root.mimeType.startsWith("image/") ? [item(root, [])] : [];

  const out: Item[] = [];
  const seen = new Set<string>();
  const walk = async (folderId: string, path: string[]) => {
    if (seen.has(folderId)) return; // a shortcut back to a folder already read
    seen.add(folderId);
    let page: string | undefined;
    do {
      const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
      const r = await get<{ files: DriveFile[]; nextPageToken?: string }>(
        `${API}?q=${q}&fields=nextPageToken,files(id,name,mimeType,shortcutDetails)&pageSize=1000&includeItemsFromAllDrives=true${page ? `&pageToken=${page}` : ""}`,
      );
      for (const f of r.files) {
        const mime = f.shortcutDetails?.targetMimeType ?? f.mimeType;
        const target = { id: f.shortcutDetails?.targetId ?? f.id, name: f.name };
        if (mime === FOLDER) await walk(target.id, [...path, f.name]);
        else if (mime.startsWith("image/")) out.push(item(target, path));
      }
      onFound(out.length);
      page = r.nextPageToken;
    } while (page);
  };
  await walk(root.id, [root.name]);
  return out;
}
