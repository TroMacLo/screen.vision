import { useState, useEffect, useRef, MouseEvent } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  CornerUpLeft,
} from "@geist-ui/icons";
import { Button } from "../ui/button";
import { Markdown } from "../markdown";
import { TaskCardBase } from "./task-card-base";
import { SkeletonContent } from "./skeleton-content";
import { ConfettiEmoji } from "./confetti-emoji";
import {
  TaskHistoryItem,
  FollowUpItem,
  TASK_CARD_BASE_CLASS,
  CONFETTI_EMOJIS,
} from "./types";

const FollowUpDropdown = ({
  followUp,
  isOpen,
  onToggle,
}: {
  followUp: FollowUpItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="border-t border-foreground/10 pt-3 mt-3">
      <button
        className="flex items-center justify-between w-full text-left text-[0.95rem] text-foreground/85 hover:text-black transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <span className="font-medium truncate pr-2">{followUp.question}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 text-sm animate-fade-in-up text-foreground/70">
          <Markdown>{followUp.answer}</Markdown>
        </div>
      )}
    </div>
  );
};

const FollowUpsList = ({ followUps }: { followUps?: FollowUpItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const prevLength = useRef(followUps?.length ?? 0);

  useEffect(() => {
    if (followUps && followUps.length > prevLength.current) {
      setOpenIndex(followUps.length - 1);
    }
    prevLength.current = followUps?.length ?? 0;
  }, [followUps?.length]);

  useEffect(() => {
    if (followUps?.length && openIndex === null) {
      setOpenIndex(followUps.length - 1);
    }
  }, []);

  if (!followUps?.length) return null;

  const reversed = [...followUps].reverse();

  return (
    <>
      {reversed.map((followUp, displayIndex) => {
        const originalIndex = followUps.length - 1 - displayIndex;
        return (
          <FollowUpDropdown
            key={originalIndex}
            followUp={followUp}
            isOpen={openIndex === originalIndex}
            onToggle={() =>
              setOpenIndex(openIndex === originalIndex ? null : originalIndex)
            }
          />
        );
      })}
    </>
  );
};

const ZoomableImage = ({ src }: { src: string }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const updatePosition = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div
      className="overflow-hidden rounded-lg shadow-md animate-fade-in-up"
      style={{ cursor: "zoom-in" }}
      onMouseEnter={(e) => {
        updatePosition(e);
        setIsHovering(true);
      }}
      onMouseLeave={() => setIsHovering(false)}
      onMouseMove={updatePosition}
    >
      <img
        src={src}
        className="w-full transition-transform duration-200 ease-out"
        style={{
          transform: isHovering ? "scale(1.5)" : "scale(1)",
          transformOrigin: `${position.x}% ${position.y}%`,
        }}
      />
    </div>
  );
};

const extractLink = (text: string) =>
  text.match(/https?:\/\/[^\s]+/)?.[0]?.replace(/[.,;:!?]+$/, "");

interface TaskCardProps {
  task: TaskHistoryItem;
  taskNumber: number;
  isCurrentTask: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onReturnHere?: () => void;
  isLoading?: boolean;
  isLoadingPreviewImage?: boolean;
  isAnalyzingScreen?: boolean;
  animationKey?: number;
  totalTasks?: number;
  onRefresh?: () => void;
  onNextTask?: () => void;
  onStartOver?: () => void;
  isPip?: boolean;
  isCompleting?: boolean;
  shouldAnimateIn?: boolean;
}

export const TaskCard = ({
  task,
  taskNumber,
  isCurrentTask,
  isExpanded = false,
  onToggleExpand,
  onReturnHere,
  isLoading = false,
  isLoadingPreviewImage = false,
  isAnalyzingScreen = false,
  animationKey = 0,
  totalTasks = 0,
  onRefresh,
  onNextTask,
  onStartOver,
  isPip = false,
  isCompleting = false,
  shouldAnimateIn = false,
}: TaskCardProps) => {
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [completionPhase, setCompletionPhase] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isExpanded) {
      setIsCollapsing(false);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (isCompleting) {
      setCompletionPhase(1);
      const timer = setTimeout(() => {
        setCompletionPhase(2);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setCompletionPhase(1);
    }
  }, [isCompleting]);

  const text = task.text;
  const textLower = text.toLowerCase();
  const link = extractLink(text);

  const isCompleted = textLower === "done" || textLower === "done.";
  const isWaiting = textLower === "wait" || textLower === "wait.";
  const isScrollDown = textLower.startsWith("scroll down");
  const isScrollUp = textLower.startsWith("scroll up");

  const handleToggleExpand = () => {
    if (isExpanded) {
      setIsCollapsing(true);
      setTimeout(() => {
        setIsCollapsing(false);
        onToggleExpand?.();
      }, 120);
    } else {
      onToggleExpand?.();
    }
  };

  const getDisplayText = () => {
    if (link) return `Open ${link}`;
    if (isCompleted) return "Done";
    if (isWaiting) return "Wait";
    if (isScrollDown) return "Scroll down";
    if (isScrollUp) return "Scroll up";
    return text.split("\n")[0] || text;
  };

  if (!isExpanded && !isCollapsing) {
    return (
      <div
        className={`collapsed-task mb-2 py-2 px-3 flex items-center rounded-md bg-foreground/5 text-sm text-foreground/65 cursor-pointer transition-all duration-300 hover:bg-foreground/10 overflow-hidden ${
          shouldAnimateIn ? "animate-fade-in-up" : ""
        }`}
        onClick={handleToggleExpand}
      >
        <span className="font-medium text-foreground/70 mr-1 flex-shrink-0">
          {taskNumber}.
        </span>
        <span className="flex-1 min-w-0 truncate whitespace-nowrap overflow-hidden text-ellipsis">
          {getDisplayText()}
        </span>
        <ChevronDown className="w-4 h-4 ml-2 text-foreground/40 flex-shrink-0" />
      </div>
    );
  }

  if (!isCurrentTask && (isExpanded || isCollapsing)) {
    return (
      <div
        className={`overflow-hidden ${
          isCollapsing ? "animate-collapse-task" : "animate-expand-task"
        }`}
      >
        <TaskCardBase className="mb-2 transition-all duration-300">
          <div
            className="flex items-start justify-between gap-2 cursor-pointer"
            onClick={() => !isCollapsing && handleToggleExpand()}
          >
            <div className="flex-1">
              <TaskContent task={task} link={link} isPip={isPip} />
            </div>
            <ChevronUp className="w-4 h-4 mt-1 text-foreground/40 flex-shrink-0" />
          </div>
          {onReturnHere && (
            <div className="mt-4">
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onReturnHere();
                }}
                leftIcon={<CornerUpLeft />}
              >
                Return Here
              </Button>
            </div>
          )}
          <FollowUpsList followUps={task.followUps} />
        </TaskCardBase>
      </div>
    );
  }

  if (isCompleting && isCurrentTask) {
    const collapseClass = isPip
      ? "animate-task-completed-collapse-pip"
      : "animate-task-completed-collapse";
    return (
      <TaskCardBase
        animationKey={animationKey}
        taskHistoryLength={totalTasks}
        className={`relative ${completionPhase === 2 ? collapseClass : ""}`}
      >
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="animate-task-completed-checkmark flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-7 h-7 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>
        <div className="invisible">
          <Markdown>{text}</Markdown>
          {task.previewImage && (
            <div className="mt-4 relative max-w-[500px]">
              <img src={task.previewImage} className="w-full" />
            </div>
          )}
          <div className="mt-4">
            <Button size="sm" leftIcon={<Check />}>
              Done
            </Button>
          </div>
        </div>
      </TaskCardBase>
    );
  }

  if (isCompleted) {
    return (
      <TaskCardBase
        animationKey={animationKey}
        taskHistoryLength={totalTasks}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none z-0">
          {CONFETTI_EMOJIS.map((emoji, i) => (
            <ConfettiEmoji key={i} emoji={emoji} index={i} />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center py-4">
          <div className="mb-6 mt-2">
            <span className="text-6xl">🎉</span>
          </div>
          <p className="text-2xl font-bold mb-2">All done!</p>
          <p className="text-gray-500 mb-4">
            You&apos;ve completed all the steps.
          </p>
          {onStartOver && (
            <Button onClick={onStartOver}>Ask a New Question</Button>
          )}
        </div>
      </TaskCardBase>
    );
  }

  if (isWaiting) {
    return (
      <TaskCardBase
        animationKey={animationKey}
        taskHistoryLength={totalTasks}
        showRefreshButton
        onRefresh={onRefresh}
        actionButton={{
          label: "Done",
          icon: <Check />,
          onClick: onNextTask ?? (() => {}),
          disabled: isLoading,
        }}
        isAnalyzingScreen={isAnalyzingScreen}
        footer={<FollowUpsList followUps={task.followUps} />}
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-foreground/60" />
          <span>Wait for the page to load</span>
        </div>
      </TaskCardBase>
    );
  }

  if (isScrollDown || isScrollUp) {
    return (
      <TaskCardBase
        animationKey={animationKey}
        taskHistoryLength={totalTasks}
        showRefreshButton
        onRefresh={onRefresh}
        actionButton={{
          label: "Done",
          icon: <Check />,
          onClick: onNextTask ?? (() => {}),
          disabled: isLoading,
        }}
        isAnalyzingScreen={isAnalyzingScreen}
        footer={<FollowUpsList followUps={task.followUps} />}
      >
        <div className="flex items-center gap-3">
          {isScrollUp ? (
            <ChevronUp className="w-5 h-5 text-foreground/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-foreground/60" />
          )}
          <span>Scroll {isScrollUp ? "up" : "down"}</span>
        </div>
      </TaskCardBase>
    );
  }

  if (link) {
    return (
      <TaskCardBase
        animationKey={animationKey}
        taskHistoryLength={totalTasks}
        showRefreshButton
        onRefresh={onRefresh}
        actionButton={{
          label: "Done",
          icon: <Check />,
          onClick: onNextTask ?? (() => {}),
          disabled: isLoading,
        }}
        isAnalyzingScreen={isAnalyzingScreen}
        footer={<FollowUpsList followUps={task.followUps} />}
      >
        <div className={isPip ? "" : "flex flex-col gap-1"}>
          <span>
            Open a new tab in your browser and navigate to{isPip ? " " : ":"}
          </span>
          <span
            className="text-blue-600 hover:underline cursor-pointer break-all"
            onClick={() => window.open(link, "_blank")}
          >
            {link}
            <ExternalLink className="w-3 h-3 inline ml-1 align-baseline" />
          </span>
        </div>
      </TaskCardBase>
    );
  }

  return (
    <TaskCardBase
      animationKey={animationKey}
      taskHistoryLength={totalTasks}
      showRefreshButton
      onRefresh={onRefresh}
      actionButton={{
        label: "Done",
        icon: <Check />,
        onClick: onNextTask ?? (() => {}),
        disabled: isLoading,
      }}
      isAnalyzingScreen={isAnalyzingScreen}
      footer={<FollowUpsList followUps={task.followUps} />}
      decreasePaddingButton={!task.previewImage}
    >
      <Markdown>{text}</Markdown>
      {(task.previewImage || isLoadingPreviewImage) && (
        <div className="mt-4 relative max-w-[500px]">
          {task.previewImage && <ZoomableImage src={task.previewImage} />}
        </div>
      )}
    </TaskCardBase>
  );
};

const TaskContent = ({
  task,
  link,
  isPip,
}: {
  task: TaskHistoryItem;
  link?: string;
  isPip?: boolean;
}) => {
  if (link) {
    return (
      <div className={isPip ? "" : "flex flex-col gap-1"}>
        <span>
          Open a new tab in your browser and navigate to{isPip ? " " : ":"}
        </span>
        <span
          className="text-blue-600 hover:underline cursor-pointer break-all"
          onClick={(e) => {
            e.stopPropagation();
            window.open(link, "_blank");
          }}
        >
          {link}
        </span>
      </div>
    );
  }

  return (
    <>
      <Markdown>{task.text}</Markdown>
      {task.previewImage && (
        <div className="mt-4 relative max-w-[500px]">
          <ZoomableImage src={task.previewImage} />
        </div>
      )}
    </>
  );
};

interface LoadingTaskCardProps {
  isPip?: boolean;
  skipAnimation?: boolean;
}

export const LoadingTaskCard = ({
  isPip = false,
  skipAnimation = false,
}: LoadingTaskCardProps) => (
  <div
    className={`${TASK_CARD_BASE_CLASS} ${
      skipAnimation ? "" : "animate-fade-in-up"
    } ${isPip ? "p-3" : ""}`}
  >
    <SkeletonContent compact={isPip} />
  </div>
);

interface ExceededLimitCardProps {
  onStartOver?: () => void;
}

export const ExceededLimitCard = ({ onStartOver }: ExceededLimitCardProps) => (
  <TaskCardBase>
    <div className="flex flex-col items-center justify-center text-center py-4">
      <p className="text-2xl font-bold mb-2">Step limit reached</p>
      <p className="text-gray-500 mb-4">
        You&apos;ve reached the maximum number of steps for this session.
      </p>
      {onStartOver && (
        <button
          onClick={onStartOver}
          className="text-sm text-blue-600 hover:underline"
        >
          Start over
        </button>
      )}
    </div>
  </TaskCardBase>
);
