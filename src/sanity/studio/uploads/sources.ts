import { unzip } from "fflate";
import { isPhoto, type Item } from "./data";
import { driveId, driveItems } from "./drive";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
  heic: "image/heic",
  heif: "image/heif",
};

const typeOf = (name: string) => TYPES[name.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
const isZip = (name: string) => /\.zip$/i.test(name);

/** The photos in a ZIP (e.g. a Google Drive, Dropbox or OneDrive download), keeping the folders inside it. */
async function zipItems(zip: Item): Promise<Item[]> {
  const data = new Uint8Array(await (await zip.load()).arrayBuffer());
  const files = await new Promise<Record<string, Uint8Array>>((res, rej) =>
    unzip(data, { filter: (f) => !f.name.startsWith("__MACOSX/") && isPhoto(f.name.split("/").pop() ?? "") }, (err, out) => (err ? rej(err) : res(out))),
  );
  return Object.entries(files).map(([full, bytes]) => {
    const parts = full.split("/").filter(Boolean);
    const name = parts.pop() ?? "photo";
    const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: typeOf(name) });
    return { name, path: [...zip.path, ...parts], load: async () => blob };
  });
}

/** Replaces each ZIP among the items with the photos inside it. */
export async function openZips(items: Item[]) {
  const out: Item[] = [];
  for (const i of items) out.push(...(isZip(i.name) ? await zipItems(i) : [i]));
  return out;
}

export const isZipOrPhoto = (f: File) => isZip(f.name) || isPhoto(f.name, f.type);

/** A Dropbox share link as its direct download; other links unchanged. */
const direct = (url: URL) => {
  if (/(^|\.)dropbox\.com$/.test(url.hostname)) {
    url.hostname = "dl.dropboxusercontent.com";
    url.searchParams.delete("dl");
  }
  return url.toString();
};

/** Photos from pasted links, one per line: Google Drive links (folders too) through Drive, others downloaded as they are. */
export async function linkItems(text: string, onFound: (count: number) => void): Promise<Item[]> {
  const out: Item[] = [];
  for (const line of text.split(/\s+/).map((l) => l.trim()).filter(Boolean)) {
    let url: URL;
    try {
      url = new URL(line);
    } catch {
      throw new Error(`Not a web link: ${line}`);
    }
    if (/(^|\.)google\.com$/.test(url.hostname) && driveId(line)) {
      out.push(...(await driveItems(line, (n) => onFound(out.length + n))));
      continue;
    }
    const last = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
    out.push({
      name: last || `photo-${out.length + 1}`,
      path: [],
      known: true,
      load: async () => {
        const res = await fetch(direct(url)).catch(() => null);
        if (!res?.ok) throw new Error(`Couldn't download ${line}`);
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) throw new Error(`Not a photo: ${line}`);
        return blob;
      },
    });
    onFound(out.length);
  }
  return out;
}
