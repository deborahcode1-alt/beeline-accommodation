"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { PROFILE_SUBJECTS, BLURB_MAX } from "@/lib/hostProfile";

type Initial = {
  name: string;
  bio: string;
  website: string;
  publicPhone: string;
  publicEmail: string;
  photoUrl: string;
  blurb: string;
  languages: string;
  hostType: string;
  yearsHosting: string;
  livesOnSite: string;
  checkInStyle: string;
  responseTime: string;
  notificationEmail: string;
  notificationPhone: string;
};

export function HostProfileForm({ hostId, initial }: { hostId: string; initial: Initial }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function handlePhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`hosts/${hostId}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: `/api/admin/hosts/${hostId}/photo/upload`,
      });
      update("photoUrl", blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hosts/${hostId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const fieldErrors = data.error?.fieldErrors as Record<string, string[]> | undefined;
        const first = fieldErrors && Object.values(fieldErrors).flat()[0];
        throw new Error(first ?? "Could not save your profile");
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  const input = "rounded-md border border-card-border px-3 py-2";
  return (
    <form onSubmit={handleSubmit} className="grid max-w-xl gap-4">
      <div className="flex items-center gap-4">
        {form.photoUrl ? (
          <Image
            src={form.photoUrl}
            alt="Your photo"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-soft text-xs text-muted">
            No photo
          </div>
        )}
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-card-border px-3 py-1.5 text-sm font-medium hover:border-accent disabled:opacity-50"
          >
            {uploading ? "Uploading..." : form.photoUrl ? "Change photo" : "Upload photo"}
          </button>
          {form.photoUrl && (
            <button
              type="button"
              onClick={() => update("photoUrl", "")}
              className="text-xs text-muted hover:underline"
            >
              Remove
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhoto(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Name shown to guests
        <input
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
          className={input}
        />
      </label>
      <fieldset className="grid gap-4 rounded-lg border border-card-border bg-soft p-4">
        <legend className="px-1 text-sm font-semibold">About you and your place</legend>

        <label className="flex flex-col gap-1 text-sm">
          A little blurb
          <input
            value={form.blurb}
            onChange={(e) => update("blurb", e.target.value.slice(0, BLURB_MAX))}
            maxLength={BLURB_MAX}
            placeholder="One or two friendly sentences guests see under your name"
            className={input}
          />
          <span className="text-xs text-muted">
            {form.blurb.length}/{BLURB_MAX} characters
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {PROFILE_SUBJECTS.map((subject) => (
            <label key={subject.key} className="flex flex-col gap-1 text-sm">
              {subject.label}
              <select
                value={form[subject.key]}
                onChange={(e) => update(subject.key, e.target.value)}
                className={input}
              >
                <option value="">Prefer not to say</option>
                {subject.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-sm">
            Languages you speak
            <input
              value={form.languages}
              onChange={(e) => update("languages", e.target.value)}
              placeholder="e.g. English, Italian"
              className={input}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          More about you and your place (optional)
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={4}
            className={input}
          />
        </label>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border border-card-border p-4">
        <legend className="px-1 text-sm font-semibold">
          How guests can reach you (shown publicly)
        </legend>
        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            value={form.publicPhone}
            onChange={(e) => update("publicPhone", e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={form.publicEmail}
            onChange={(e) => update("publicEmail", e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Your website (optional)
          <input
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            placeholder="https://"
            className={input}
          />
        </label>
        <p className="text-xs text-muted">
          Leave phone and email blank to keep them private. Guests can still send you a message
          from your listing.
        </p>
      </fieldset>

      <fieldset className="grid gap-4 rounded-lg border border-card-border p-4">
        <legend className="px-1 text-sm font-semibold">
          Where we send your booking alerts (private)
        </legend>
        <label className="flex flex-col gap-1 text-sm">
          Alert email
          <input
            type="email"
            value={form.notificationEmail}
            onChange={(e) => update("notificationEmail", e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Alert mobile (for text alerts)
          <input
            value={form.notificationPhone}
            onChange={(e) => update("notificationPhone", e.target.value)}
            className={input}
          />
        </label>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-accent-deep">Profile saved.</p>}
      <button
        type="submit"
        disabled={saving || uploading}
        className="w-fit rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg transition hover:bg-accent-hover disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
