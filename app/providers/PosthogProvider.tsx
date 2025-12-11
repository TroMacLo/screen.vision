// app/providers.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: "/relay",
      ui_host: "https://us.posthog.com",
      person_profiles: "always",
      defaults: "2025-11-30",
      session_recording: {
        maskAllInputs: false,
        maskTextSelector: null,
        blockSelector: "img",
      },
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
