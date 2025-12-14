"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const isChunkLoadError =
      error.message?.includes("Loading chunk") ||
      error.message?.includes("ChunkLoadError") ||
      error.message?.includes("Failed to fetch dynamically imported module") ||
      error.name === "ChunkLoadError";

    if (isChunkLoadError) {
      const hasReloaded = sessionStorage.getItem("chunk-error-reload");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk-error-reload", "true");
        window.location.reload();
        return;
      }
      sessionStorage.removeItem("chunk-error-reload");
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">
          We encountered an error. Please try again.
        </p>
        <button
          onClick={() => {
            sessionStorage.removeItem("chunk-error-reload");
            window.location.reload();
          }}
          className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}

