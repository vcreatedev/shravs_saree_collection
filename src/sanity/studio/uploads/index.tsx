import { useState } from "react";
import { insert, setIfMissing, unset, type ArrayOfObjectsInputProps, type AssetSource, type AssetSourceComponentProps, type Tool } from "sanity";
import { Box, Button, Card, Dialog, Stack } from "@sanity/ui";
import { FolderIcon } from "@sanity/icons/Folder";
import { Library } from "./Library";

/** The Uploads tab next to Structure: the folders and photos, managed. */
export const uploadsTool: Tool = {
  name: "uploads",
  title: "Uploads",
  icon: FolderIcon,
  component: () => (
    <Card height="fill" overflow="auto" padding={4}>
      <Box style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Library />
      </Box>
    </Card>
  ),
};

/** "Uploads" in the Select menu of every photo field: pick one photo from the folders. */
function UploadsSource(props: AssetSourceComponentProps) {
  return (
    <Dialog id="uploads-source" header={props.dialogHeaderTitle ?? "Pick a photo from Uploads"} width={4} onClose={props.onClose}>
      <Box padding={4}>
        <Library pick={{ multiple: false, onPick: ([id]) => props.onSelect([{ kind: "assetDocumentId", value: id }]) }} />
      </Box>
    </Dialog>
  );
}

export const uploadsAssetSource: AssetSource = { name: "shravs-uploads", title: "Uploads", icon: FolderIcon, component: UploadsSource };

/** A list of photos (a product's, a colour's) with "Add from Uploads" to add many at once. */
export function PhotosInput(props: ArrayOfObjectsInputProps) {
  const [open, setOpen] = useState(false);
  const addPhotos = (ids: string[]) => {
    // A slot made with "Add item" and left without a photo would sit before the new ones as a blank first photo
    const blank = ((props.value ?? []) as { _key: string; asset?: unknown }[]).filter((i) => !i.asset);
    props.onChange([
      ...blank.map((i) => unset([{ _key: i._key }])),
      setIfMissing([]),
      insert(ids.map((id) => ({ _type: "image", _key: crypto.randomUUID().slice(0, 12), asset: { _type: "reference", _ref: id } })), "after", [-1]),
    ]);
    setOpen(false);
  };
  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      <Button icon={FolderIcon} text="Add from Uploads" mode="ghost" disabled={props.readOnly} onClick={() => setOpen(true)} />
      {open && (
        <Dialog id="uploads-add" header="Add photos from Uploads" width={4} onClose={() => setOpen(false)}>
          <Box padding={4}>
            <Library pick={{ multiple: true, onPick: addPhotos }} />
          </Box>
        </Dialog>
      )}
    </Stack>
  );
}
