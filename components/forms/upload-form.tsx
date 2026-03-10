"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ACCEPTED_UPLOAD_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { compressImageForUpload } from "@/lib/image-compression";

export type UploadWeekOption = {
  id: string;
  week_index: number;
  title: string;
};

interface UploadFormProps {
  weeks: UploadWeekOption[];
  onUploaded?: () => void;
}

export function UploadForm({ weeks, onUploaded }: UploadFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file || !weekId || !title.trim()) {
      setError("Title, week, and file are required.");
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);

    let uploadFile = file;

    if (file.type.startsWith("image/")) {
      try {
        setStatus("Compressing image...");
        uploadFile = await compressImageForUpload(file, {
          maxBytes: MAX_UPLOAD_SIZE_BYTES,
          maxWidth: 3200,
          maxHeight: 3200,
          outputType: "image/webp",
          forceTransform: !ACCEPTED_UPLOAD_MIME_TYPES.includes(file.type) || file.size > MAX_UPLOAD_SIZE_BYTES
        });
      } catch (compressionError) {
        const message = compressionError instanceof Error ? compressionError.message : "Image compression failed";
        setError(message);
        setStatus(null);
        setLoading(false);
        return;
      }
    }

    if (!ACCEPTED_UPLOAD_MIME_TYPES.includes(uploadFile.type)) {
      setError(`Unsupported file type: ${uploadFile.type}`);
      setStatus(null);
      setLoading(false);
      return;
    }

    if (uploadFile.size > MAX_UPLOAD_SIZE_BYTES) {
      setError(`File is too large. Maximum is ${Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))} MB.`);
      setStatus(null);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setError("You must be logged in to upload files.");
      setLoading(false);
      return;
    }

    const sanitized = uploadFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
    const storagePath = `week-${weekId}/${authData.user.id}/${Date.now()}-${sanitized}`;

    setStatus("Uploading...");
    const { error: storageError } = await supabase.storage.from("course-files").upload(storagePath, uploadFile, {
      contentType: uploadFile.type,
      upsert: false
    });

    if (storageError) {
      setError(`Storage upload failed: ${storageError.message}`);
      setLoading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("course-files").getPublicUrl(storagePath);

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: title.trim(),
        week_id: weekId,
        file_url: publicUrlData.publicUrl,
        mime_type: uploadFile.type,
        storage_path: storagePath,
        size_bytes: uploadFile.size
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      // Roll back uploaded object if metadata insert fails.
      await supabase.storage.from("course-files").remove([storagePath]);
      setError(payload.error ?? "Upload metadata save failed");
      setLoading(false);
      return;
    }

    setStatus("Uploaded successfully");
    setTitle("");
    setFile(null);
    setFileInputKey((prev) => prev + 1);
    onUploaded?.();
    router.refresh();
    setLoading(false);
  }

  return (
    <form className="card form-stack" onSubmit={onSubmit}>
      <h3 className="section-title">Upload Class Material</h3>
      <p className="subtle">Allowed: PDF, images (auto-compressed), DOC/DOCX, PPT/PPTX (max 25 MB)</p>

      <div className="field">
        <label htmlFor="upload-title">Title</label>
        <input id="upload-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="upload-week">Week</label>
        <select id="upload-week" value={weekId} onChange={(e) => setWeekId(e.target.value)} required>
          {weeks.map((week) => (
            <option key={week.id} value={week.id}>
              Week {week.week_index}: {week.title}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="upload-file">File</label>
        <input
          key={fileInputKey}
          id="upload-file"
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
          required
        />
      </div>

      <button disabled={loading}>{loading ? "Uploading..." : "Upload"}</button>
      {error ? <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p> : null}
      {status ? <p className="subtle" style={{ margin: 0 }}>{status}</p> : null}
    </form>
  );
}
