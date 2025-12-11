// hooks/pip.tsx
import { useTasks } from "@/app/providers/TaskProvider";
import { useAnalytics } from "@/app/providers/AnalyticsProvider";
import { TaskScreen } from "@/components/task-screen";
import { useCallback, useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { useScreenShare } from "./screenshare";

const isDocumentPipSupported = () => {
  if (typeof window === "undefined") return false;

  // Safari doesn't support Document PiP, return false
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) return false;

  return "documentPictureInPicture" in window;
};
export const useTaskPip = () => {
  const taskContext = useTasks();
  const { tasks, isLoading, reset: resetTasks, goal } = taskContext;
  const { stopSharing } = useScreenShare();
  const { trackTaskRefreshed, trackAllTasksCompleted, trackStartOverClicked } =
    useAnalytics();

  const [isPipActive, setIsPipActive] = useState(false);
  const [isPipVisible, setIsPipVisible] = useState(false);

  const activeRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    activeRef.current = isPipActive;
  }, [isPipActive]);

  useEffect(() => {
    visibleRef.current = isPipVisible;
  }, [isPipVisible]);

  const pipWindowRef = useRef<Window | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isOpeningRef = useRef(false);
  const isClosedRef = useRef(true);

  const { captureImageFromStream, setPipDetailsGetter, setPipCloseCallback } =
    useScreenShare();

  const baseWidth = 400;
  const baseHeight = 500;

  const updatePipContentRef = useRef<() => void>(() => {});

  const openPipWindow = useCallback(async () => {
    if (activeRef.current || isOpeningRef.current) {
      return;
    }
    isOpeningRef.current = true;

    const width = baseWidth;
    const height = baseHeight;

    try {
      let pipWindow: Window | null = null;

      // @ts-ignore
      if (isDocumentPipSupported() && window.documentPictureInPicture) {
        // @ts-ignore
        pipWindow = await window.documentPictureInPicture.requestWindow({
          width,
          height,
        });
      } else {
        // Fallback for Safari and other browsers: open a popup window
        const left = window.screen.width - width - 20; // 20px margin from right edge
        const top = window.screen.height - height - 100; // 100px margin from bottom (accounting for taskbar)
        const features = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;

        pipWindow = window.open("about:blank", "ChatPiP", features);

        if (!pipWindow) {
          alert(
            "Please allow popups for this site to use the floating window feature."
          );
          return;
        }

        // Set up the popup window
        pipWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Chat Messages</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>html, body { overflow: hidden; margin: 0; padding: 0; height: 100%; }</style>
            </head>
            <body>
              <div id="pip-root"></div>
            </body>
          </html>
        `);
        pipWindow.document.close();
      }

      if (!pipWindow) {
        isOpeningRef.current = false;
        return;
      }

      pipWindowRef.current = pipWindow;
      setIsPipActive(true);
      isOpeningRef.current = false;
      setIsPipVisible(pipWindow.document.visibilityState === "visible");

      const handleVisibilityChange = () => {
        if (pipWindow) {
          setIsPipVisible(pipWindow.document.visibilityState === "visible");
        }
      };
      pipWindow.document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      // Copy stylesheets
      const stylesheets = Array.from(document.styleSheets);
      stylesheets.forEach((sheet) => {
        try {
          const css = Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
          const style = pipWindow!.document.createElement("style");
          style.textContent = css;
          pipWindow!.document.head.appendChild(style);
        } catch (e) {
          const link = pipWindow!.document.createElement("link");
          link.rel = "stylesheet";
          link.href = (sheet as CSSStyleSheet).href || "";
          pipWindow!.document.head.appendChild(link);
        }
      });

      // Prevent double scrollbar by hiding overflow on body
      const pipBodyStyle = pipWindow.document.createElement("style");
      pipBodyStyle.textContent = "html, body { overflow: hidden; margin: 0; padding: 0; height: 100%; }";
      pipWindow.document.head.appendChild(pipBodyStyle);

      // Create or get container
      let container = pipWindow.document.getElementById(
        "pip-root"
      ) as HTMLDivElement;
      if (!container) {
        container = pipWindow.document.createElement("div");
        container.id = "pip-root";
        pipWindow.document.body.appendChild(container);
      }
      containerRef.current = container;

      isClosedRef.current = false;
      reactRootRef.current = createRoot(container);
      updatePipContentRef.current();

      const handleClose = () => {
        isClosedRef.current = true;
        if (reactRootRef.current) {
          reactRootRef.current.unmount();
          reactRootRef.current = null;
        }
        setIsPipActive(false);
        pipWindowRef.current = null;
      };

      pipWindow.addEventListener("pagehide", handleClose);
      pipWindow.addEventListener("beforeunload", handleClose);
    } catch (error) {
      isOpeningRef.current = false;
      if (error instanceof Error && error.name === "NotAllowedError") {
        return;
      }
      console.error("Failed to open PiP window:", error);
    }
  }, []);

  const handlePipStartOver = useCallback(() => {
    trackStartOverClicked();

    isClosedRef.current = true;
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
    if (reactRootRef.current) {
      reactRootRef.current.unmount();
      reactRootRef.current = null;
    }
    setIsPipActive(false);
    setIsPipVisible(false);

    stopSharing();
    resetTasks();

    window.focus();
  }, [stopSharing, resetTasks, trackStartOverClicked]);

  const updatePipContent = useCallback(() => {
    if (isClosedRef.current || !reactRootRef.current) return;

    reactRootRef.current.render(
      <TaskScreen
        {...taskContext}
        tasks={tasks}
        goal={goal}
        isLoading={isLoading}
        onStartOver={handlePipStartOver}
        isPip
        onTaskRefreshed={trackTaskRefreshed}
        onAllTasksCompleted={trackAllTasksCompleted}
      />
    );
  }, [
    taskContext,
    tasks,
    goal,
    isLoading,
    handlePipStartOver,
    trackTaskRefreshed,
    trackAllTasksCompleted,
  ]);

  // Keep the ref updated with the latest updatePipContent function
  useEffect(() => {
    updatePipContentRef.current = updatePipContent;
  }, [updatePipContent]);

  useEffect(() => {
    updatePipContent();
  }, [updatePipContent]);

  const closePipWindow = useCallback(() => {
    isClosedRef.current = true;
    if (reactRootRef.current) {
      reactRootRef.current.unmount();
      reactRootRef.current = null;
    }
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
    setIsPipActive(false);
    setIsPipVisible(false);
  }, []);

  const getPipDetails = useCallback(() => {
    if (!pipWindowRef.current) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isActive: false,
        isVisible: false,
      };
    }
    return {
      x: pipWindowRef.current.screenX,
      y: pipWindowRef.current.screenY,
      width: pipWindowRef.current.outerWidth,
      height: pipWindowRef.current.outerHeight,
      isActive: activeRef.current,
      isVisible: visibleRef.current,
    };
  }, []);

  useEffect(() => {
    setPipDetailsGetter(getPipDetails);
    return () =>
      setPipDetailsGetter(() => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        isActive: false,
        isVisible: false,
      }));
  }, [setPipDetailsGetter, getPipDetails]);

  useEffect(() => {
    setPipCloseCallback(closePipWindow);
    return () => setPipCloseCallback(null);
  }, [setPipCloseCallback, closePipWindow]);

  return {
    isPipActive,
    openPipWindow,
    updatePipContent,
    closePipWindow,
    getPipDetails,
  };
};
