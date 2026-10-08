"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

type Photo = { id: string; url: string; alt: string };

type PendingUpload = {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "saving" | "error";
  error?: string;
};

export function PhotoManager({ listingId, photos }: { listingId: string; photos: Photo[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [busy, setBusy] = useState(false);

  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const entries: PendingUpload[] = imageFiles.map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      progress: 0,
      status: "uploading",
    }));
    setPending((prev) => [...prev, ...entries]);

    await Promise.all(
      imageFiles.map(async (file, i) => {
        const entryId = entries[i].id;
        try {
          const blob = await upload(
            `listings/${listingId}/${crypto.randomUUID()}-${file.name}`,
            file,
            {
              access: "public",
              handleUploadUrl: `/api/admin/listings/${listingId}/photos/upload`,
              contentType: file.type,
              onUploadProgress: ({ percentage }) => {
                setPending((prev) =>
                  prev.map((p) => (p.id === entryId ? { ...p, progress: percentage } : p))
                );
              },
            }
          );

          setPending((prev) =>
            prev.map((p) => (p.id === entryId ? { ...p, status: "saving" } : p))
          );

          const res = await fetch(`/api/admin/listings/${listingId}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: blob.url }),
          });
          if (!res.ok) throw new Error("Could not save photo");

          setPending((prev) => prev.filter((p) => p.id !== entryId));
        } catch (err) {
          setPending((prev) =>
            prev.map((p) =>
              p.id === entryId
                ? { ...p, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : p
            )
          );
        }
      })
    );

    router.refresh();
  }

  async function addPhotoByUrl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setUrlError(null);
    try {
      const res = await fetch(`/api/admin/listings/${listingId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, alt: alt || undefined }),
      });
      if (!res.ok) throw new Error("Could not add photo — check the URL");
      setUrl("");
      setAlt("");
      router.refresh();
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Could not add photo");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photoId: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/listings/${listingId}/photos?photoId=${photoId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {photos.map((p) => (
          <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg">
            <Image src={p.url} alt={p.alt || "Listing photo"} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(p.id)}
              disabled={busy}
              className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        ))}
        {pending.map((p) => (
          <div
            key={p.id}
            className="relative flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border border-card-border bg-foreground/5 p-2 text-center"
          >
            {p.status === "error" ? (
              <span className="text-xs text-red-600">{p.error}</span>
            ) : (
              <>
                <span className="text-xs text-muted">
                  {p.status === "saving" ? "Saving…" : `${Math.round(p.progress)}%`}
                </span>
                <div className="h-1 w-3/4 overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${p.status === "saving" ? 100 : p.progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-6 py-8 text-center transition ${
          dragging
            ? "border-accent bg-accent/10"
            : "border-card-border hover:bg-foreground/5"
        }`}
      >
        <p className="text-sm font-medium">Drag photos here, or click to browse</p>
        <p className="text-xs text-muted">
          JPG, PNG, WEBP, AVIF or GIF, up to 15MB each. The first photo becomes the cover photo.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted">
          Or add a photo by URL instead
        </summary>
        <form onSubmit={addPhotoByUrl} className="mt-3 flex flex-wrap gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://... photo URL"
            required
            className="min-w-[220px] flex-1 rounded-md border border-card-border px-3 py-2 text-sm"
          />
          <input
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Description (optional)"
            className="w-48 rounded-md border border-card-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            Add photo
          </button>
        </form>
        {urlError && <p className="mt-2 text-sm text-red-600">{urlError}</p>}
      </details>
    </div>
  );
}
