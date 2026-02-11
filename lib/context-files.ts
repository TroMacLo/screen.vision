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

export async function analyzeContextFiles(
  files: File[]
): Promise<AnalyzedContextFile[]> {
  const oversized = files.find((file) => file.size > MAX_CONTEXT_FILE_SIZE_BYTES);
  if (oversized) {
    throw new Error(`'${oversized.name}' exceeds the 30MB limit.`);
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  const response = await fetch(`${aiApiUrl}/file-context`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`File analysis failed (${response.status}).`);
  }

  const payload = (await response.json()) as AnalyzeFilesResponse;

  return payload.files.map((file) => ({
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    mimeType: file.mime_type,
    analysis: file.analysis,
  }));
}

export function buildContextFromFiles(files: AnalyzedContextFile[]): string {
  return files
    .map(
      (file) =>
        `File: ${file.name} (${Math.ceil(file.size / 1024)} KB)\nType: ${file.mimeType}\n\n${file.analysis}`
    )
    .join("\n\n---\n\n");
}
