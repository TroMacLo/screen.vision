"use client";

import { useEffect } from "react";

export function ChunkErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const isChunkError =
        event.message?.includes("Loading chunk") ||
        event.message?.includes("ChunkLoadError") ||
        event.message?.includes(
          "Failed to fetch dynamically imported module"
        ) ||
        event.error?.name === "ChunkLoadError";

      if (isChunkError) {
        event.preventDefault();
        const hasReloaded = sessionStorage.getItem("chunk-error-reload");
        if (!hasReloaded) {
          sessionStorage.setItem("chunk-error-reload", "true");
          window.location.reload();
        }
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason);
      const isChunkError =
        message.includes("Loading chunk") ||
        message.includes("ChunkLoadError") ||
        message.includes("Failed to fetch dynamically imported module") ||
        event.reason?.name === "ChunkLoadError";

      if (isChunkError) {
        event.preventDefault();
        const hasReloaded = sessionStorage.getItem("chunk-error-reload");
        if (!hasReloaded) {
          sessionStorage.setItem("chunk-error-reload", "true");
          window.location.reload();
        }
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    sessionStorage.removeItem("chunk-error-reload");

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return <>{children}</>;
}
