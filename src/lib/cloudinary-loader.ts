"use client";

// Cloudinary already runs its own global CDN and image transformation
// pipeline, so routing every photo through Next's built-in image optimizer
// as well means an extra hop (and a Vercel function invocation) on top of
// Cloudinary's own. This loader asks Cloudinary directly for an
// auto-format, auto-quality, correctly-sized version instead.
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!src.includes("res.cloudinary.com") || !src.includes("/upload/")) return src;
  const params = `f_auto,q_${quality ?? "auto"},w_${width}`;
  return src.replace("/upload/", `/upload/${params}/`);
}
