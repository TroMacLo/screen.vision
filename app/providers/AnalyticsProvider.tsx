"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { usePostHog } from "posthog-js/react";
import { getSystemInfo } from "@/lib/utils";

interface QuestionSession {
  id: string;
  questionText: string;
  startTime: number;
  stepsCompleted: number;
}

type SessionOutcome = "completed" | "abandoned" | "max_steps" | "started_over";

interface AnalyticsContextType {
  startQuestionSession: (questionText: string) => string;
  endQuestionSession: (outcome: SessionOutcome) => void;

  trackSuggestedActionClicked: (action: string) => void;
  trackScreenshareAccepted: () => void;
  trackScreenshareDeclined: () => void;
  trackScreenshareStarted: () => void;

  trackPlanGenerated: (stepCount: number, steps: string[]) => void;
  trackTaskRefreshed: (taskText: string, stepNumber: number) => void;
  trackAllTasksCompleted: () => void;

  trackFollowupQuestionAsked: (question: string) => void;
  trackFollowupResponseReceived: (question: string) => void;

  trackMaxStepsExceeded: () => void;
  trackStartOverClicked: () => void;

  getCurrentSessionId: () => string | null;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(
  undefined
);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const posthog = usePostHog();
  const sessionRef = useRef<QuestionSession | null>(null);

  useEffect(() => {
    const systemInfo = getSystemInfo();
    posthog.setPersonProperties({
      browser: systemInfo.browser.browserName,
      os: systemInfo.os.osName,
      is_mobile:
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ),
    });
  }, [posthog]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionRef.current) {
        endQuestionSession("abandoned");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const getSessionProperties = useCallback(() => {
    if (!sessionRef.current) return {};
    return {
      question_session_id: sessionRef.current.id,
      question_text: sessionRef.current.questionText,
    };
  }, []);

  const startQuestionSession = useCallback(
    (questionText: string): string => {
      if (sessionRef.current) {
        endQuestionSession("started_over");
      }

      const sessionId = crypto.randomUUID();
      sessionRef.current = {
        id: sessionId,
        questionText,
        startTime: Date.now(),
        stepsCompleted: 0,
      };

      posthog.capture("question_session_started", {
        question_session_id: sessionId,
        question_text: questionText,
      });

      return sessionId;
    },
    [posthog]
  );

  const endQuestionSession = useCallback(
    (outcome: SessionOutcome) => {
      if (!sessionRef.current) return;

      const session = sessionRef.current;
      const totalDuration = Date.now() - session.startTime;

      posthog.capture("question_session_ended", {
        question_session_id: session.id,
        question_text: session.questionText,
        total_duration_ms: totalDuration,
        steps_completed: session.stepsCompleted,
        outcome,
      });

      sessionRef.current = null;
    },
    [posthog]
  );

  const trackSuggestedActionClicked = useCallback(
    (action: string) => {
      posthog.capture("suggested_action_clicked", {
        ...getSessionProperties(),
        action,
      });
    },
    [posthog, getSessionProperties]
  );

  const trackScreenshareAccepted = useCallback(() => {
    posthog.capture("screenshare_accepted", getSessionProperties());
  }, [posthog, getSessionProperties]);

  const trackScreenshareDeclined = useCallback(() => {
    posthog.capture("screenshare_declined", getSessionProperties());
  }, [posthog, getSessionProperties]);

  const trackScreenshareStarted = useCallback(() => {
    posthog.capture("screenshare_started", getSessionProperties());
  }, [posthog, getSessionProperties]);

  const trackPlanGenerated = useCallback(
    (stepCount: number, steps: string[]) => {
      posthog.capture("plan_generated", {
        ...getSessionProperties(),
        step_count: stepCount,
        steps,
      });
    },
    [posthog, getSessionProperties]
  );

  const trackTaskRefreshed = useCallback(
    (taskText: string, stepNumber: number) => {
      posthog.capture("task_refreshed", {
        ...getSessionProperties(),
        task_text: taskText,
        step_number: stepNumber,
      });
    },
    [posthog, getSessionProperties]
  );

  const trackAllTasksCompleted = useCallback(() => {
    posthog.capture("all_tasks_completed", {
      ...getSessionProperties(),
      steps_completed: sessionRef.current?.stepsCompleted ?? 0,
      total_duration_ms: sessionRef.current
        ? Date.now() - sessionRef.current.startTime
        : 0,
    });
    endQuestionSession("completed");
  }, [posthog, getSessionProperties, endQuestionSession]);

  const trackFollowupQuestionAsked = useCallback(
    (question: string) => {
      posthog.capture("followup_question_asked", {
        ...getSessionProperties(),
        followup_question: question,
      });
    },
    [posthog, getSessionProperties]
  );

  const trackFollowupResponseReceived = useCallback(
    (question: string) => {
      posthog.capture("followup_response_received", {
        ...getSessionProperties(),
        followup_question: question,
      });
    },
    [posthog, getSessionProperties]
  );

  const trackMaxStepsExceeded = useCallback(() => {
    posthog.capture("max_steps_exceeded", {
      ...getSessionProperties(),
      steps_completed: sessionRef.current?.stepsCompleted ?? 0,
    });
    endQuestionSession("max_steps");
  }, [posthog, getSessionProperties, endQuestionSession]);

  const trackStartOverClicked = useCallback(() => {
    posthog.capture("start_over_clicked", {
      ...getSessionProperties(),
      steps_completed: sessionRef.current?.stepsCompleted ?? 0,
      total_duration_ms: sessionRef.current
        ? Date.now() - sessionRef.current.startTime
        : 0,
    });
    endQuestionSession("started_over");
  }, [posthog, getSessionProperties, endQuestionSession]);

  const getCurrentSessionId = useCallback(() => {
    return sessionRef.current?.id ?? null;
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        startQuestionSession,
        endQuestionSession,
        trackSuggestedActionClicked,
        trackScreenshareAccepted,
        trackScreenshareDeclined,
        trackScreenshareStarted,
        trackPlanGenerated,
        trackTaskRefreshed,
        trackAllTasksCompleted,
        trackFollowupQuestionAsked,
        trackFollowupResponseReceived,
        trackMaxStepsExceeded,
        trackStartOverClicked,
        getCurrentSessionId,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider");
  }
  return context;
}
