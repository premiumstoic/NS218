"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  ACCEPTED_AVATAR_MIME_TYPES,
  MAX_AVATAR_SIZE_BYTES,
  PROFILE_THEME_MAP,
  PROFILE_THEME_OPTIONS
} from "@/lib/constants";
import { compressImageForUpload } from "@/lib/image-compression";
import { ThemeToken } from "@/lib/types";

interface ProfilePersonalizationFormProps {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    theme_token: ThemeToken;
  };
}

export function ProfilePersonalizationForm({ profile }: ProfilePersonalizationFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [themeToken, setThemeToken] = useState<ThemeToken>(profile.theme_token ?? "sage");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url);

  useEffect(() => {
    if (!avatarFile) {
      setPreviewUrl(profile.avatar_url);
      return;
    }

    const url = URL.createObjectURL(avatarFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile, profile.avatar_url]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);
    setError(null);
    setLoading(true);

    let avatarUrl = profile.avatar_url;

    if (avatarFile) {
      let preparedAvatar = avatarFile;

      if (avatarFile.type.startsWith("image/")) {
        try {
          setStatus("Compressing avatar...");
          preparedAvatar = await compressImageForUpload(avatarFile, {
            maxBytes: MAX_AVATAR_SIZE_BYTES,
            maxWidth: 768,
            maxHeight: 768,
            outputType: "image/webp",
            forceTransform: !ACCEPTED_AVATAR_MIME_TYPES.includes(avatarFile.type) || avatarFile.size > MAX_AVATAR_SIZE_BYTES
          });
        } catch (compressionError) {
          const message = compressionError instanceof Error ? compressionError.message : "Avatar compression failed";
          setError(message);
          setLoading(false);
          return;
        }
      }

      if (!ACCEPTED_AVATAR_MIME_TYPES.includes(preparedAvatar.type)) {
        setError(`Unsupported avatar type: ${preparedAvatar.type}`);
        setLoading(false);
        return;
      }

      if (preparedAvatar.size > MAX_AVATAR_SIZE_BYTES) {
        setError(`Avatar too large. Maximum is ${Math.round(MAX_AVATAR_SIZE_BYTES / (1024 * 1024))} MB.`);
        setLoading(false);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        setError("You must be logged in to update your avatar.");
        setLoading(false);
        return;
      }

      const sanitized = preparedAvatar.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const storagePath = `${profile.id}/${Date.now()}-${sanitized}`;

      const { error: uploadError } = await supabase.storage.from("profile-avatars").upload(storagePath, preparedAvatar, {
        contentType: preparedAvatar.type,
        upsert: true
      });

      if (uploadError) {
        setError(`Avatar upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from("profile-avatars").getPublicUrl(storagePath);
      avatarUrl = publicUrlData.publicUrl;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        display_name: displayName.trim(),
        theme_token: themeToken,
        avatar_url: avatarUrl
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Profile update failed.");
      setLoading(false);
      return;
    }

    setStatus("Profile updated");
    setAvatarFile(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h2 className="section-title">Personalization</h2>

      <div className="field">
        <label htmlFor="profile-display-name">Display name</label>
        <input
          id="profile-display-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={120}
          required
        />
      </div>

      <div className="field">
        <label htmlFor="profile-avatar">Profile picture (any image, auto-compressed, max 2 MB)</label>
        <input
          id="profile-avatar"
          type="file"
          accept="image/*"
          onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
        />
      </div>

      {previewUrl ? (
        <img
          src={previewUrl}
          alt="Profile avatar preview"
          width={84}
          height={84}
          style={{ borderRadius: "999px", objectFit: "cover", border: "1px solid var(--line)" }}
        />
      ) : null}

      <div className="field">
        <label>Profile theme</label>
        <div className="theme-grid">
          {PROFILE_THEME_OPTIONS.map((option) => {
            const selected = option.token === themeToken;
            return (
              <button
                key={option.token}
                type="button"
                className={selected ? "theme-option active" : "theme-option"}
                onClick={() => setThemeToken(option.token)}
                style={{ background: option.cardBackground, borderColor: option.cardBorder }}
                aria-label={`Select ${option.label} theme`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <article
        className="card"
        style={{
          background: PROFILE_THEME_MAP[themeToken].cardBackground,
          borderColor: PROFILE_THEME_MAP[themeToken].cardBorder,
          margin: 0
        }}
      >
        <strong>Preview</strong>
        <p className="subtle" style={{ marginBottom: 0 }}>
          This color will appear on your comments and upload cards.
        </p>
      </article>

      <button disabled={loading}>{loading ? "Saving..." : "Save profile"}</button>
      {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
      {status ? <p className="subtle" style={{ margin: 0 }}>{status}</p> : null}
    </form>
  );
}
