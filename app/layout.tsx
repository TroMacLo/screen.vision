import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { TaskProvider } from "./providers/TaskProvider";
import { AnalyticsProvider } from "./providers/AnalyticsProvider";
import { SettingsProvider } from "./providers/SettingsProvider";
import { PostHogProvider } from "./providers/PosthogProvider";
import { ChunkErrorHandler } from "./providers/ChunkErrorHandler";

export const metadata = {
  metadataBase: new URL("https://screen.vision"),
  title: "Screen Vision",
  description:
    "Share your screen with AI. Get a guided tour for anything, right on your screen.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          GeistSans.className,
          "font-inter-var",
          "antialiased dark",
          "bg-background"
        )}
      >
        <Toaster position="top-center" richColors />
        <ChunkErrorHandler>
          <PostHogProvider>
            <AnalyticsProvider>
              <SettingsProvider>
                <TaskProvider>{children}</TaskProvider>
              </SettingsProvider>
            </AnalyticsProvider>
          </PostHogProvider>
        </ChunkErrorHandler>
      </body>
    </html>
  );
}
