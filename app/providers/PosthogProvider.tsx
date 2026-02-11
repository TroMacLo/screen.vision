// app/providers.tsx
"use client";

import { useEffect } from "react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      posthog.init(key, {
        api_host: "/relay",
        ui_host: "https://us.posthog.com",
        person_profiles: "always",
        disable_session_recording: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
