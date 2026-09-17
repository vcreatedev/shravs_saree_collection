"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  folder: string;
  multiple?: boolean;
};

async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function ImageUploader({ images, onChange, folder, multiple = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(fileList)) {
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressed, file.name.replace(/\.[^.]+$/, ".jpg"));
        formData.append("folder", folder || "uploads");

        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || `Could not upload ${file.name}`);
          continue;
        }
        uploaded.push(data.url);
      } catch {
        toast.error(`Network error uploading ${file.name}`);
      }
    }

    if (uploaded.length) {
      onChange(multiple ? [...images, ...uploaded] : uploaded.slice(0, 1));
      toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}`);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(url: string) {
    onChange(images.filter((i) => i !== url));
  }

  const showAddButton = multiple || images.length === 0;

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div key={url} className="group relative h-24 w-20 overflow-hidden rounded-lg border hairline">
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(url)}
              aria-label="Remove image"
              className="absolute right-1 top-1 rounded-full bg-ink/80 p-1 text-cream opacity-0 transition-opacity group-hover:opacity-100 hover:bg-signal"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {showAddButton && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-24 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed hairline text-ink-soft transition-colors hover:border-ink disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
            <span className="text-[10px]">{uploading ? "Uploading" : "Add photo"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="mt-2 text-xs text-ink-soft">
        Upload directly from your device (camera or gallery) — photos are automatically resized and
        stored on Cloudinary.
      </p>
    </div>
  );
}
