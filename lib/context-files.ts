"use client";

import { aiApiUrl } from "./ai";

export interface AnalyzedContextFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  analysis: string;
}

interface AnalyzeFilesResponse {
  files: Array<{
    name: string;
    size: number;
    mime_type: string;
    analysis: string;
  }>;
}

export const MAX_CONTEXT_FILE_SIZE_BYTES = 30 * 1024 * 1024;

async function analyzeFileLocally(file: File): Promise<string> {
  const isTextLike =
    file.type.startsWith("text/") ||
    /\.(md|txt|json|yaml|yml|csv|log|xml|html|js|ts|tsx|py|java|go|rb|rs|sql)$/i.test(
      file.name
    );

  if (file.type.startsWith("image/")) {
    return `Image attached: ${file.name}. (Local mode — server-side analysis unavailable.)`;
  }

  if (isTextLike || file.type === "application/json") {
    const content = await file.text();
    const trimmed = content.trim();
    return trimmed.length > 12000
      ? `${trimmed.slice(0, 12000)}\n...[truncated]`
      : trimmed;
  }

  return `Attached file: ${file.name} (${file.type || "unknown type"}). Local analysis not available for this file type.`;
}

export async function analyzeContextFiles(
  files: File[]
): Promise<AnalyzedContextFile[]> {
  const oversized = files.find((file) => file.size > MAX_CONTEXT_FILE_SIZE_BYTES);
  if (oversized) {
    throw new Error(`'${oversized.name}' exceeds the 30MB limit.`);
  }

  // Try the backend API first
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file, file.name);
    });

    const response = await fetch(`${aiApiUrl}/file-context`, {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const payload = (await response.json()) as AnalyzeFilesResponse;

      return payload.files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        mimeType: file.mime_type,
        analysis: file.analysis,
      }));
    }
  } catch {
    // API unreachable — fall through to local analysis
  }

  // Fallback: analyze files locally in the browser
  return Promise.all(
    files.map(async (file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      analysis: await analyzeFileLocally(file),
    }))
  );
}

export function buildContextFromFiles(files: AnalyzedContextFile[]): string {
  return files
    .map(
      (file) =>
        `File: ${file.name} (${Math.ceil(file.size / 1024)} KB)\nType: ${file.mimeType}\n\n${file.analysis}`
    )
    .join("\n\n---\n\n");
}
