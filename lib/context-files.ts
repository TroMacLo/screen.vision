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
const MAX_LOCAL_TEXT_PREVIEW = 12_000;

const TEXT_EXTENSIONS = [
  ".md",
  ".markdown",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".xml",
  ".log",
  ".html",
  ".js",
  ".ts",
  ".tsx",
  ".py",
  ".sql",
  ".csv",
];

const hasTextExtension = (fileName: string) => {
  const lower = fileName.toLowerCase();
  return TEXT_EXTENSIONS.some((extension) => lower.endsWith(extension));
};

const truncate = (value: string, maxLength = MAX_LOCAL_TEXT_PREVIEW) => {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}\n...[truncated]`;
};

async function localAnalyzeFiles(files: File[]): Promise<AnalyzedContextFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const mimeType = file.type || "application/octet-stream";
      const isTextLike = mimeType.startsWith("text/") || hasTextExtension(file.name);

      let analysis = `Attached file: ${file.name}.`;

      if (isTextLike) {
        const content = await file.text();
        analysis = truncate(content) || `Attached text file: ${file.name}.`;
      } else if (mimeType.startsWith("image/")) {
        analysis =
          `Image attached: ${file.name}. ` +
          "Image summarization API was unavailable, so the assistant will use the image as a provided reference.";
      } else if (
        file.name.toLowerCase().endsWith(".pdf") ||
        file.name.toLowerCase().endsWith(".doc") ||
        file.name.toLowerCase().endsWith(".docx") ||
        file.name.toLowerCase().endsWith(".xls") ||
        file.name.toLowerCase().endsWith(".xlsx")
      ) {
        analysis =
          `Document attached: ${file.name}. ` +
          "Server-side document analysis API was unavailable, but the file is still included as user-provided context.";
      }

      return {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        mimeType,
        analysis,
      };
    })
  );
}

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

  let response: Response;

  try {
    response = await fetch(`${aiApiUrl}/file-context`, {
      method: "POST",
      body: formData,
    });
  } catch {
    return localAnalyzeFiles(files);
  }

  if (response.status === 404 || response.status === 405 || response.status === 501) {
    return localAnalyzeFiles(files);
  }

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
