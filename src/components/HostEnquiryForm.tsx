"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  ENQUIRY_MAX_PHOTOS,
  ENQUIRY_MAX_PHOTO_BYTES,
  ENQUIRY_PHOTO_TYPES,
} from "@/lib/enquiryPhotos";

type Photo = {
  id: string;
  name: string;
  status: "uploading" | "done" | "error";
  url?: string;
  error?: string;
};

export function HostEnquiryForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", area: "", details: "", website: "" });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const uploading = photos.some((p) => p.status === "uploading");
  const maxMb = Math.round(ENQUIRY_MAX_PHOTO_BYTES / (1024 * 1024));

  async function addFiles(files: FileList) {
    setError(null);
    const room = ENQUIRY_MAX_PHOTOS - photos.length;
    const chosen = Array.from(files).slice(0, Math.max(room, 0));
    if (files.length > room) {
      setError(`You can add up to ${ENQUIRY_MAX_PHOTOS} photos.`);
    }

    await Promise.all(
      chosen.map(async (file) => {
        const id = crypto.randomUUID();
        if (!ENQUIRY_PHOTO_TYPES.includes(file.type)) {
          setPhotos((p) => [
            ...p,
            { id, name: file.name, status: "error", error: "Use a JPG, PNG, WebP or AVIF photo." },
          ]);
          return;
        }
        if (file.size > ENQUIRY_MAX_PHOTO_BYTES) {
          setPhotos((p) => [
            ...p,
            { id, name: file.name, status: "error", error: `Photos can be up to ${maxMb} MB.` },
          ]);
          return;
        }
        setPhotos((p) => [...p, { id, name: file.name, status: "uploading" }]);
        try {
          const blob = await upload(`enquiries/${crypto.randomUUID()}/${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/host-enquiries/upload",
          });
          setPhotos((p) => p.map((x) => (x.id === id ? { ...x, status: "done", url: blob.url } : x)));
        } catch (err) {
          setPhotos((p) =>
            p.map((x) =>
              x.id === id
                ? { ...x, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : x
            )
          );
        }
      })
    );
  }

  function removePhoto(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/host-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: form.phone || undefined,
          details: form.details || undefined,
          photoUrls: photos.filter((p) => p.status === "done" && p.url).map((p) => p.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <p className="rounded-lg bg-soft p-5 text-sm">
        Thanks &mdash; we&apos;ve got your details
        {photos.some((p) => p.status === "done") ? " and photos" : ""} and will be in touch soon.
      </p>
    );
  }

  const input = "rounded-md border border-card-border bg-background px-3 py-2";
  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Your name
        <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone (optional)
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={input} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Which town or area is your property in?
        <input value={form.area} onChange={(e) => update("area", e.target.value)} required className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Tell us about your property (optional)
        <textarea value={form.details} onChange={(e) => update("details", e.target.value)} rows={4} className={input} />
      </label>

      <div className="grid gap-2 text-sm">
        <span>Photos of your place (optional)</span>
        <div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={photos.length >= ENQUIRY_MAX_PHOTOS}
            className="rounded-md border border-card-border bg-background px-4 py-2 font-medium hover:border-accent disabled:opacity-50"
          >
            Choose photos
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ENQUIRY_PHOTO_TYPES.join(",")}
            hidden
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="ml-3 text-xs text-muted">
            Up to {ENQUIRY_MAX_PHOTOS} photos, {maxMb} MB each (JPG, PNG, WebP or AVIF)
          </span>
        </div>
        {photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id} className="relative overflow-hidden rounded-lg border border-card-border">
                <div className="relative aspect-[4/3] bg-foreground/5">
                  {p.status === "done" && p.url && (
                    <Image src={p.url} alt={p.name} fill sizes="160px" className="object-cover" />
                  )}
                  {p.status === "uploading" && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">
                      Uploading...
                    </span>
                  )}
                  {p.status === "error" && (
                    <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-xs text-red-600">
                      {p.error}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Honeypot field: hidden from people, tempting to bots. */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={(e) => update("website", e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending" || uploading}
        className="w-fit rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {state === "sending" ? "Sending..." : uploading ? "Uploading photos..." : "Register your interest"}
      </button>
    </form>
  );
}
