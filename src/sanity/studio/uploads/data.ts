import type { SanityClient } from "sanity";

/**
 * The Uploads library: photos (Sanity image assets marked with a `library` field) kept in folders, which are documents
 * with ids under "uploads.". In a public dataset, folder names (like every published document and photo) can be read
 * without signing in.
 */
export const FOLDER_TYPE = "uploadFolder";
export type Folder = { _id: string; name: string; parent: string | null };
export type Photo = { _id: string; url: string; name: string; folder: string | null };
/** A photo to add: its file name, the folders below the destination it goes in, and how to get its bytes.
 *  `known`: a photo even without a photo file name (a web link), checked when it downloads. */
export type Item = { name: string; path: string[]; load: () => Promise<Blob>; known?: boolean };
export type Progress = { label: string; total: number; done: number; failed: string[] };

const ref = (id: string) => ({ _type: "reference", _ref: id, _weak: true });
const PHOTO = /\.(jpe?g|png|webp|gif|avif|tiff?|bmp|heic|heif)$/i;
export const isPhoto = (name: string, type = "") => !name.startsWith(".") && (type.startsWith("image/") || PHOTO.test(name));
export const isPhotoItem = (i: Item) => !!i.known || isPhoto(i.name);

/** All folders and how many photos sit directly in each, in one request. */
export async function loadTree(client: SanityClient) {
  const r = await client.fetch<{ folders: Folder[]; refs: string[] }>(
    `{ "folders": *[_type == $t] | order(lower(name)) { _id, name, "parent": coalesce(parent._ref, null) },
       "refs": *[_type == "sanity.imageAsset" && defined(library.folder)].library.folder._ref }`,
    { t: FOLDER_TYPE },
  );
  const counts: Record<string, number> = {};
  for (const itemRef of r.refs) counts[itemRef] = (counts[itemRef] ?? 0) + 1;
  return { folders: r.folders, counts };
}

export const loadPhotos = (client: SanityClient, folder: string | null) =>
  client.fetch<Photo[]>(
    `*[_type == "sanity.imageAsset" && defined(library) && (($f == null && !defined(library.folder)) || library.folder._ref == $f)]
      | order(library.added desc) { _id, url, "name": coalesce(originalFilename, "photo"), "folder": coalesce(library.folder._ref, null) }`,
    { f: folder },
  );

export const children = (folders: Folder[], parent: string | null) => folders.filter((f) => f.parent === parent);

/** A folder and every folder inside it. */
export function descendants(folders: Folder[], id: string): string[] {
  return [id, ...children(folders, id).flatMap((f) => descendants(folders, f._id))];
}

/** The folders from the top down to `id`. */
export function trail(folders: Folder[], id: string | null): Folder[] {
  const out: Folder[] = [];
  for (let f = folders.find((x) => x._id === id); f; f = folders.find((x) => x._id === f!.parent)) out.unshift(f);
  return out;
}

export async function createFolder(client: SanityClient, name: string, parent: string | null): Promise<Folder> {
  const doc = await client.create({ _id: `uploads.${crypto.randomUUID()}`, _type: FOLDER_TYPE, name: name.trim(), ...(parent && { parent: ref(parent) }) });
  return { _id: doc._id, name: doc.name as string, parent };
}

/** The folder at `path` below `dest`, reusing folders of the same name and creating the rest. Mutates `folders`. */
async function folderAt(client: SanityClient, folders: Folder[], dest: string | null, path: string[]) {
  let at = dest;
  for (const name of path) {
    const same = children(folders, at).find((f) => f.name.toLowerCase() === name.trim().toLowerCase());
    if (same) at = same._id;
    else {
      const made = await createFolder(client, name, at);
      folders.push(made);
      at = made._id;
    }
  }
  return at;
}

async function pool<T>(items: T[], size: number, run: (item: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) await run(items[next++]);
  }));
}

/** Uploads photos into `dest`, recreating their folders inside it; reports progress after each one. */
export async function uploadItems(client: SanityClient, items: Item[], dest: string | null, folders: Folder[], label: string, report: (p: Progress) => void) {
  const photos = items.filter(isPhotoItem);
  const progress: Progress = { label, total: photos.length, done: 0, failed: [] };
  report({ ...progress });
  // Folders first, one at a time, so two photos of a new folder never create it twice
  const at = new Map<string, string | null>();
  for (const i of photos) {
    const key = i.path.join("/");
    if (!at.has(key)) at.set(key, await folderAt(client, folders, dest, i.path));
  }
  await pool(photos, 4, async (i) => {
    try {
      const asset = await client.assets.upload("image", await i.load(), { filename: i.name });
      const folder = at.get(i.path.join("/")) ?? null;
      await client.patch(asset._id).set({ library: { added: new Date().toISOString(), ...(folder && { folder: ref(folder) }) } }).commit();
    } catch {
      progress.failed.push([...i.path, i.name].join("/"));
    }
    progress.done++;
    report({ ...progress });
  });
  return progress;
}

export async function movePhotos(client: SanityClient, ids: string[], folder: string | null) {
  const tx = client.transaction();
  for (const id of ids) tx.patch(id, (p) => (folder ? p.set({ "library.folder": ref(folder) }) : p.unset(["library.folder"])));
  await tx.commit();
}

/** Takes photos out of Uploads, deleting each one no product or page uses; returns how many were kept for that. */
export async function removePhotos(client: SanityClient, ids: string[]) {
  let kept = 0;
  await pool(ids, 4, async (id) => {
    try {
      await client.delete(id);
    } catch {
      kept++;
      await client.patch(id).unset(["library"]).commit();
    }
  });
  return kept;
}

export const renameFolder = (client: SanityClient, id: string, name: string) => client.patch(id).set({ name: name.trim() }).commit();

/** Deletes a folder, the folders inside it and their photos (photos in use stay where they're used). */
export async function deleteFolder(client: SanityClient, folders: Folder[], id: string) {
  const ids = descendants(folders, id);
  const photos = await client.fetch<string[]>(`*[_type == "sanity.imageAsset" && library.folder._ref in $ids]._id`, { ids });
  const kept = await removePhotos(client, photos);
  const tx = client.transaction();
  for (const f of ids) tx.delete(f);
  await tx.commit();
  return { photos: photos.length, kept };
}
