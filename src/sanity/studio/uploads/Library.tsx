import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useClient } from "sanity";
import { Box, Button, Card, Dialog, Flex, Select, Spinner, Stack, Text, TextArea, TextInput } from "@sanity/ui";
import { useToast } from "@sanity/ui/toast";
import { AddIcon } from "@sanity/icons/Add";
import { CheckmarkIcon } from "@sanity/icons/Checkmark";
import { EditIcon } from "@sanity/icons/Edit";
import { FolderIcon } from "@sanity/icons/Folder";
import { LinkIcon } from "@sanity/icons/Link";
import { TrashIcon } from "@sanity/icons/Trash";
import { UploadIcon } from "@sanity/icons/Upload";
import * as lib from "./data";
import { driveItems, driveReady } from "./drive";
import { isZipOrPhoto, linkItems, openZips } from "./sources";

type Pick = { multiple: boolean; onPick: (ids: string[]) => void };
type Ask = "newFolder" | "rename" | "deleteFolder" | "drive" | "links" | "move" | "remove";

const fileItem = (f: File, path: string[]): lib.Item => ({ name: f.name, path, load: async () => f });

/** Files and folders dropped on the page, with each file's folders. Entries must be taken during the drop event. */
async function fromEntries(entries: FileSystemEntry[]) {
  const out: lib.Item[] = [];
  const walk = async (entry: FileSystemEntry, path: string[]): Promise<void> => {
    if (entry.isFile) out.push(fileItem(await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej)), path));
    else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        if (!batch.length) break;
        for (const e of batch) await walk(e, [...path, entry.name]);
      }
    }
  };
  for (const e of entries) await walk(e, []);
  return out;
}

const grid = (min: number) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`, gap: 12 });

/**
 * The Uploads library: folders like Google Drive's, photos added from the computer (files or whole folders, also
 * by dropping them here) or a shared Google Drive folder, keeping their subfolders. Picking mode (`pick`) is used
 * while editing a product: click photos, then add them.
 */
export function Library({ pick }: { pick?: Pick }) {
  const base = useClient({ apiVersion: "2026-02-01" });
  const client = useMemo(() => base.withConfig({ perspective: "raw" }), [base]);
  const toast = useToast();
  const [folders, setFolders] = useState<lib.Folder[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [here, setHere] = useState<string | null>(null);
  const [photos, setPhotos] = useState<lib.Photo[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<lib.Progress | null>(null);
  const [ask, setAsk] = useState<Ask | null>(null);
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const folderInput = useRef<HTMLInputElement | null>(null);

  const fail = useCallback((e: unknown) => toast.push({ status: "error", title: "Something went wrong", description: e instanceof Error ? e.message : String(e) }), [toast]);
  // The folder tree loads once and again after a change; opening a folder only fetches its photos
  const loadTree = useCallback(async () => {
    const t = await lib.loadTree(client);
    setFolders(t.folders);
    setCounts(t.counts);
  }, [client]);
  const load = useCallback(async (at: string | null) => {
    const [, p] = await Promise.all([loadTree(), lib.loadPhotos(client, at)]);
    setPhotos(p);
  }, [client, loadTree]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTree().catch(fail);
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTree, fail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhotos(null);
      setSelected([]);
      lib.loadPhotos(client, here).then(setPhotos).catch(fail);
    }, 0);
    return () => clearTimeout(timer);
  }, [here, client, fail]);

  const busy = progress !== null;
  const path = lib.trail(folders, here);
  const subfolders = lib.children(folders, here);
  const current = path[path.length - 1];

  async function add(label: string, items: lib.Item[] | Promise<lib.Item[]>) {
    if (busy) return;
    setProgress({ label, total: 0, done: 0, failed: [] });
    try {
      let list = await items;
      if (list.some((i) => /\.zip$/i.test(i.name))) {
        setProgress({ label: "Opening ZIP files", total: 0, done: 0, failed: [] });
        list = await openZips(list);
      }
      if (!list.some(lib.isPhotoItem)) {
        toast.push({ status: "warning", title: "No photos found", description: "Only photo files (JPG, PNG, WebP and the like) are added." });
      } else {
        const r = await lib.uploadItems(client, list, here, [...folders], label, setProgress);
        const ok = r.total - r.failed.length;
        toast.push({
          status: r.failed.length ? "warning" : "success",
          title: `Added ${ok} photo${ok === 1 ? "" : "s"}`,
          description: r.failed.length ? `Couldn't add ${r.failed.length}: ${r.failed.slice(0, 4).join(", ")}${r.failed.length > 4 ? "..." : ""}` : undefined,
        });
      }
    } catch (e) {
      fail(e);
    } finally {
      setProgress(null);
      await load(here).catch(fail);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    const entries = [...e.dataTransfer.items].map((i) => i.webkitGetAsEntry?.()).filter((x): x is FileSystemEntry => !!x);
    add("Uploading", entries.length ? fromEntries(entries) : [...e.dataTransfer.files].map((f) => fileItem(f, [])));
  }

  // Ctrl+V with a copied photo adds it here (not while typing in a box)
  const addRef = useRef(add);
  useEffect(() => {
    addRef.current = add;
  });
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement | null)?.isContentEditable) return;
      const files = [...(e.clipboardData?.files ?? [])].filter(isZipOrPhoto);
      if (!files.length) return;
      e.preventDefault();
      addRef.current("Uploading", files.map((f, i) => fileItem(f.name === "image.png" ? new File([f], `pasted-${Date.now()}-${i}.png`, { type: f.type }) : f, [])));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const open = (a: Ask, value = "") => { setText(value); setAsk(a); };
  const toggle = (id: string) => setSelected((s) => (pick && !pick.multiple ? [id] : s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const a = ask;
    setAsk(null);
    try {
      if (a === "newFolder" && text.trim()) await lib.createFolder(client, text, here);
      else if (a === "rename" && here && text.trim()) await lib.renameFolder(client, here, text);
      else if (a === "deleteFolder" && current) {
        const r = await lib.deleteFolder(client, folders, current._id);
        toast.push({ status: "success", title: `Deleted "${current.name}"`, description: r.kept ? `${r.kept} of its photos are used on the site, so they stay there.` : undefined });
        setHere(current.parent);
        return;
      } else if (a === "move") {
        await lib.movePhotos(client, selected, text || null);
        setSelected([]);
      } else if (a === "remove") {
        const kept = await lib.removePhotos(client, selected);
        toast.push({ status: "success", title: `Removed ${selected.length} photo${selected.length === 1 ? "" : "s"}`, description: kept ? `${kept} are used on the site, so they stay there.` : undefined });
        setSelected([]);
      } else if (a === "drive" && text.trim()) {
        const link = text;
        add("Adding from Google Drive", driveItems(link, (n) => setProgress({ label: `Looking through Google Drive: ${n} photos found`, total: 0, done: 0, failed: [] })));
        return;
      } else if (a === "links" && text.trim()) {
        const links = text;
        add("Adding from links", linkItems(links, (n) => setProgress({ label: `Reading links: ${n} photos found`, total: 0, done: 0, failed: [] })));
        return;
      }
      await load(here);
    } catch (err) {
      fail(err);
    }
  }

  const folderPath = (id: string) => lib.trail(folders, id).map((f) => f.name).join(" / ");
  const countLabel = (f: lib.Folder) => {
    const n = counts[f._id] ?? 0;
    const sub = lib.children(folders, f._id).length;
    return [sub && `${sub} folder${sub === 1 ? "" : "s"}`, `${n} photo${n === 1 ? "" : "s"}`].filter(Boolean).join(", ");
  };

  return (
    <Card
      radius={2}
      tone={dragging ? "primary" : "default"}
      onDragOver={(e) => { if (!busy && e.dataTransfer.types.includes("Files")) { e.preventDefault(); setDragging(true); } }}
      onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={onDrop}
      style={{ minHeight: 360, outline: dragging ? "2px dashed var(--card-focus-ring-color)" : undefined, outlineOffset: 4 }}
    >
      <Stack gap={4}>
        <Flex align="center" gap={1} wrap="wrap">
          <Button mode={here ? "bleed" : "default"} padding={2} icon={FolderIcon} text="Uploads" onClick={() => setHere(null)} />
          {path.map((f) => (
            <Fragment key={f._id}>
              <Text muted>/</Text>
              <Button mode={f._id === here ? "default" : "bleed"} padding={2} text={f.name} onClick={() => setHere(f._id)} />
            </Fragment>
          ))}
        </Flex>

        <Flex gap={2} wrap="wrap">
          <Button icon={AddIcon} text="New folder" mode="ghost" disabled={busy} onClick={() => open("newFolder")} />
          <Button icon={UploadIcon} text="Upload photos or ZIPs" mode="ghost" disabled={busy} onClick={() => fileInput.current?.click()} />
          <Button icon={FolderIcon} text="Upload a folder" mode="ghost" disabled={busy} onClick={() => folderInput.current?.click()} />
          <Button icon={LinkIcon} text="From Google Drive" mode="ghost" disabled={busy} onClick={() => open("drive")} />
          <Button icon={LinkIcon} text="Photo links" mode="ghost" disabled={busy} onClick={() => open("links")} />
          {current && !pick && (
            <>
              <Button icon={EditIcon} text="Rename folder" mode="bleed" disabled={busy} onClick={() => open("rename", current.name)} />
              <Button icon={TrashIcon} text="Delete folder" mode="bleed" tone="critical" disabled={busy} onClick={() => open("deleteFolder")} />
            </>
          )}
        </Flex>
        <input ref={fileInput} type="file" accept="image/*,.zip,application/zip" multiple hidden onChange={(e) => { const f = [...(e.currentTarget.files ?? [])]; e.currentTarget.value = ""; add("Uploading", f.map((x) => fileItem(x, []))); }} />
        <input
          ref={(el) => { folderInput.current = el; el?.setAttribute("webkitdirectory", ""); }}
          type="file"
          multiple
          hidden
          onChange={(e) => { const f = [...(e.currentTarget.files ?? [])]; e.currentTarget.value = ""; add("Uploading", f.map((x) => fileItem(x, x.webkitRelativePath.split("/").slice(0, -1)))); }}
        />

        {progress && (
          <Card padding={3} radius={2} tone="primary">
            <Flex align="center" gap={3}>
              <Spinner />
              <Text size={1}>
                {progress.total ? `${progress.label}: ${progress.done} of ${progress.total}${progress.failed.length ? ` (${progress.failed.length} couldn't be added)` : ""}` : progress.label}
              </Text>
            </Flex>
          </Card>
        )}

        {subfolders.length > 0 && (
          <div style={grid(200)}>
            {subfolders.map((f) => (
              <Card key={f._id} as="button" padding={3} radius={2} border onClick={() => setHere(f._id)} style={{ cursor: "pointer", textAlign: "left" }}>
                <Flex align="center" gap={3}>
                  <Text size={3}><FolderIcon /></Text>
                  <Stack gap={2} flex={1} style={{ minWidth: 0 }}>
                    <Text size={1} weight="medium" textOverflow="ellipsis">{f.name}</Text>
                    <Text size={0} muted>{countLabel(f)}</Text>
                  </Stack>
                </Flex>
              </Card>
            ))}
          </div>
        )}

        {photos === null ? (
          <Flex justify="center" padding={5}><Spinner muted /></Flex>
        ) : photos.length === 0 && subfolders.length === 0 ? (
          <Card padding={5} radius={2} border tone="transparent">
            <Text align="center" muted size={1}>Empty. Drop photos, whole folders or ZIP files here, paste a copied photo (Ctrl+V), or use the buttons above.</Text>
          </Card>
        ) : (
          <div style={grid(130)}>
            {photos.map((p) => {
              const on = selected.includes(p._id);
              return (
                <Card
                  key={p._id}
                  as="button"
                  radius={2}
                  border
                  tone={on ? "primary" : "default"}
                  aria-pressed={on}
                  title={p.name}
                  onClick={() => toggle(p._id)}
                  onDoubleClick={() => pick?.onPick([p._id])}
                  style={{ padding: 0, overflow: "hidden", cursor: "pointer", position: "relative", textAlign: "left", outline: on ? "3px solid var(--card-focus-ring-color)" : undefined, outlineOffset: -3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${p.url}?w=300&h=300&fit=crop&auto=format`} alt={p.name} loading="lazy" style={{ display: "block", width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                  <Box padding={2}><Text size={0} muted textOverflow="ellipsis">{p.name}</Text></Box>
                  {on && (
                    <Card radius={6} tone="primary" padding={1} style={{ position: "absolute", top: 6, right: 6 }}>
                      <Text size={1}><CheckmarkIcon /></Text>
                    </Card>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {selected.length > 0 && (
          <Card padding={3} radius={2} shadow={2} style={{ position: "sticky", bottom: 0, zIndex: 1 }}>
            <Flex align="center" gap={2} wrap="wrap">
              <Box flex={1}><Text size={1} weight="medium">{selected.length} selected</Text></Box>
              <Button text="Clear" mode="bleed" onClick={() => setSelected([])} />
              {pick ? (
                <Button tone="primary" icon={CheckmarkIcon} text={pick.multiple ? `Add ${selected.length} photo${selected.length === 1 ? "" : "s"}` : "Use this photo"} onClick={() => pick.onPick(selected)} />
              ) : (
                <>
                  <Button text="Move to..." mode="ghost" disabled={busy} onClick={() => open("move", here ?? "")} />
                  <Button text="Remove" mode="ghost" tone="critical" icon={TrashIcon} disabled={busy} onClick={() => open("remove")} />
                </>
              )}
            </Flex>
          </Card>
        )}
      </Stack>

      {ask && (
        <Dialog id="uploads-ask" width={1} onClose={() => setAsk(null)} header={{
          newFolder: "New folder", rename: "Rename folder", deleteFolder: "Delete folder", drive: "Add from Google Drive", links: "Add from photo links", move: "Move photos", remove: "Remove photos",
        }[ask]}>
          <form onSubmit={submit}>
            <Stack gap={4} padding={4}>
              {(ask === "newFolder" || ask === "rename") && (
                <TextInput autoFocus value={text} placeholder="Folder name" onChange={(e) => setText(e.currentTarget.value)} />
              )}
              {ask === "drive" && (driveReady ? (
                <>
                  <Text size={1} muted>Paste the link to a Google Drive folder (or one photo). Set its sharing to &quot;Anyone with the link&quot; first. The folder and its subfolders come in as folders here, inside the one you&apos;re in.</Text>
                  <TextInput autoFocus value={text} placeholder="https://drive.google.com/drive/folders/..." onChange={(e) => setText(e.currentTarget.value)} />
                </>
              ) : (
                <Text size={1}>Adding from Google Drive isn&apos;t switched on yet: it needs a Google API key in the Studio settings (SANITY_STUDIO_GOOGLE_API_KEY, see studio/.env.example). Until then, download the folder from Drive and use &quot;Upload a folder&quot;.</Text>
              ))}
              {ask === "links" && (
                <>
                  <Text size={1} muted>Paste links to photos, one per line: Dropbox, Imgur, Google Photos, Unsplash or any site that allows it. Google Drive links (folders too) work when Google Drive is switched on. Some sites don&apos;t allow downloads; those are listed afterwards.</Text>
                  <TextArea autoFocus rows={6} value={text} placeholder={"https://...\nhttps://..."} onChange={(e) => setText(e.currentTarget.value)} />
                </>
              )}
              {ask === "move" && (
                <Select value={text} onChange={(e) => setText(e.currentTarget.value)}>
                  <option value="">Uploads (top level)</option>
                  {folders.map((f) => ({ id: f._id, label: folderPath(f._id) })).sort((a, b) => a.label.localeCompare(b.label)).map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </Select>
              )}
              {ask === "deleteFolder" && current && (
                <Text size={1}>Delete &quot;{current.name}&quot; and everything in it? Photos already used on a product or page stay there.</Text>
              )}
              {ask === "remove" && (
                <Text size={1}>Remove {selected.length} photo{selected.length === 1 ? "" : "s"} from Uploads? Photos already used on a product or page stay there; the rest are deleted.</Text>
              )}
              <Flex gap={2} justify="flex-end">
                <Button text="Cancel" mode="bleed" onClick={() => setAsk(null)} />
                {!(ask === "drive" && !driveReady) && (
                  <Button
                    type="submit"
                    tone={ask === "deleteFolder" || ask === "remove" ? "critical" : "primary"}
                    text={{ newFolder: "Create", rename: "Save", deleteFolder: "Delete", drive: "Add photos", links: "Add photos", move: "Move", remove: "Remove" }[ask]}
                    disabled={(ask === "newFolder" || ask === "rename" || ask === "drive" || ask === "links") && !text.trim()}
                  />
                )}
              </Flex>
            </Stack>
          </form>
        </Dialog>
      )}
    </Card>
  );
}
