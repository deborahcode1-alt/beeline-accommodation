"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";

type AreaRow = {
  id: string;
  slug: string;
  name: string;
  state: string;
  published: boolean;
  listingCount: number;
  headline: string;
  heroImage: string;
};

async function uploadAreaPhoto(file: File): Promise<string> {
  const blob = await upload(`areas/${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/areas/upload",
  });
  return blob.url;
}

const input = "rounded-md border border-card-border px-3 py-2 text-sm";
const smallButton =
  "rounded-md border border-card-border px-3 py-1.5 text-xs font-medium hover:border-accent disabled:opacity-50";

/** A photo box: shows the picture, and lets the owner choose, change or remove it. */
function PhotoPicker({
  url,
  onChange,
  onError,
}: {
  url: string;
  onChange: (url: string) => void;
  onError: (message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function pick(file: File) {
    setUploading(true);
    try {
      onChange(await uploadAreaPhoto(file));
    } catch (err) {
      onError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        <Image src={url} alt="Area photo" width={160} height={90} className="h-[90px] w-40 rounded-md object-cover" />
      ) : (
        <div className="flex h-[90px] w-40 items-center justify-center rounded-md bg-soft text-xs text-muted">
          No photo yet
        </div>
      )}
      <div className="flex flex-col items-start gap-1">
        <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={smallButton}>
          {uploading ? "Uploading..." : url ? "Change photo" : "Upload photo"}
        </button>
        {url && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-muted hover:underline">
            Remove
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

function AreaCard({ area }: { area: AreaRow }) {
  const router = useRouter();
  const [headline, setHeadline] = useState(area.headline);
  const [heroImage, setHeroImage] = useState(area.heroImage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/areas/${area.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not save that");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const changed = headline !== area.headline || heroImage !== area.heroImage;

  return (
    <div className="rounded-2xl border border-card-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {area.name} Accommodation{" "}
            {!area.published && (
              <span className="rounded bg-soft px-1.5 py-0.5 text-xs font-normal text-muted">
                Hidden. Add a photo, then press Publish.
              </span>
            )}
          </p>
          <p className="text-sm text-muted">
            /{area.slug} &middot; {area.state} &middot; {area.listingCount} listing(s)
          </p>
        </div>
        <button onClick={() => patch({ published: !area.published })} disabled={busy} className={smallButton}>
          {area.published ? "Hide" : "Publish"}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        <PhotoPicker
          url={heroImage}
          onChange={(u) => {
            setHeroImage(u);
            setSaved(false);
          }}
          onError={setError}
        />
        <input
          value={headline}
          onChange={(e) => {
            setHeadline(e.target.value);
            setSaved(false);
          }}
          maxLength={300}
          placeholder="One-line headline for the area page (optional)"
          className={input}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy || !changed}
            onClick={async () => {
              const ok = await patch({ headline: headline.trim() || null, heroImage: heroImage || null });
              setSaved(ok);
            }}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save area"}
          </button>
          {saved && !changed && <span className="text-sm text-accent-deep">Saved.</span>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export function AreaManager({ areas }: { areas: AreaRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [state, setState] = useState("QLD");
  const [headline, setHeadline] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, state, headline: headline || undefined, heroImage: heroImage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Check the details");
      setName("");
      setHeadline("");
      setHeroImage("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the area");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form onSubmit={addArea} className="grid gap-3 rounded-2xl border border-card-border p-4 sm:grid-cols-4">
        <h2 className="text-base font-semibold sm:col-span-4">Add a new area</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Place name only, e.g. Maryborough"
          className={`${input} sm:col-span-2`}
        />
        <input
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          maxLength={3}
          aria-label="State"
          className={input}
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
        >
          Add area
        </button>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={300}
          placeholder="One-line headline for the area page (optional)"
          className={`${input} sm:col-span-4`}
        />
        <div className="sm:col-span-4">
          <p className="mb-2 text-xs text-muted">
            A wide, bright landscape photo works best (at least 1600 pixels across). It shows behind the area&apos;s
            title.
          </p>
          <PhotoPicker url={heroImage} onChange={setHeroImage} onError={setError} />
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {areas.map((a) => (
          <AreaCard key={a.id} area={a} />
        ))}
      </div>
    </div>
  );
}
