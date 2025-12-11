import { ReactNode } from "react";

export interface FollowUpItem {
  question: string;
  answer: string;
}

export interface TaskHistoryItem {
  text: string;
  previewImage?: string;
  followUps?: FollowUpItem[];
}

export interface TaskScreenProps {
  tasks?: TaskHistoryItem[];
  totalTaskCount?: number;
  hasExceededMaxSteps?: boolean;
  onNextTask?: () => void;
  onRefreshTask?: () => void;
  onStartOver?: () => void;
  returnToTask?: (taskIndex: number) => void;
  goal?: string;
  isLoading: boolean;
  isLoadingFollowUp: boolean;
  isLoadingPreviewImage: boolean;
  isAnalyzingScreen: boolean;
  sendFollowUpMessage?: (question?: string) => void;
  isPip?: boolean;
  onTaskRefreshed?: (taskText: string, stepNumber: number) => void;
  onAllTasksCompleted?: () => void;
  autoCompleteTriggered?: number;
}

export interface TaskCardBaseProps {
  children: ReactNode;
  animationKey?: number;
  taskHistoryLength?: number;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  actionButton?: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
  };
  className?: string;
  isAnalyzingScreen?: boolean;
  footer?: ReactNode;
  decreasePaddingButton?: boolean;
}

export const TASK_CARD_BASE_CLASS =
  "border border-foreground/20 rounded-lg p-4 mb-4 break-words";

export const CONFETTI_EMOJIS = ["🎉", "🎊", "✨", "🌟", "💫", "🎈", "🥳", "⭐"];

export const getTaskAnimationClass = (
  taskHistoryLength: number,
  animationKey: number
) =>
  animationKey === 0
    ? ""
    : taskHistoryLength > 1
    ? "animate-expand-task"
    : "animate-fade-in-up";
