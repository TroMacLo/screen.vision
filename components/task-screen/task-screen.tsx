import { useEffect, useMemo, useRef, useState } from "react";
import { MultimodalInput } from "../multimodal-input";
import { TaskCard, LoadingTaskCard, ExceededLimitCard } from "./task-card";
import { TaskScreenProps } from "./types";

export const TaskScreen = ({
  tasks = [],
  totalTaskCount = 0,
  hasExceededMaxSteps = false,
  onNextTask,
  onRefreshTask,
  onStartOver,
  returnToTask,
  goal,
  sendFollowUpMessage,
  isLoading,
  isLoadingFollowUp,
  isLoadingPreviewImage,
  isAnalyzingScreen,
  isPip,
  onTaskRefreshed,
  onAllTasksCompleted,
  autoCompleteTriggered = 0,
}: TaskScreenProps) => {
  const [input, setInput] = useState("");
  const [taskAnimationKey, setTaskAnimationKey] = useState(0);
  const [showInitialLoading, setShowInitialLoading] = useState(false);
  const [expandedTaskIndex, setExpandedTaskIndex] = useState<number | null>(
    null
  );
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [skipSkeletonAnimation, setSkipSkeletonAnimation] = useState(false);
  const [completingTask, setCompletingTask] = useState<
    (typeof tasks)[0] | null
  >(null);
  const [completingTaskNumber, setCompletingTaskNumber] = useState(0);
  const [completingAnimationKey, setCompletingAnimationKey] = useState(0);
  const prevTaskRef = useRef<string | undefined>(undefined);
  const hasShownFirstTask = useRef(false);
  const hasTrackedCompletion = useRef(false);
  const prevAutoCompleteTriggeredRef = useRef(autoCompleteTriggered);
  const hasInitialRender = useRef(false);

  useEffect(() => {
    hasInitialRender.current = true;
  }, []);

  const currentTask = useMemo(
    () => (isLoading ? undefined : tasks[tasks.length - 1]),
    [tasks, isLoading]
  );
  const historyTasks = useMemo(
    () => (isLoading ? tasks : tasks.slice(0, -1)),
    [tasks, isLoading]
  );
  const task = currentTask?.text;

  const isCurrentTaskExpanded = expandedTaskIndex === null;

  useEffect(() => {
    if (!hasShownFirstTask.current && isLoading) {
      const timer = setTimeout(() => setShowInitialLoading(true), 200);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (task !== prevTaskRef.current && task) {
      if (hasShownFirstTask.current && !isCompletingTask) {
        setTaskAnimationKey((k) => k + 1);
      }
      hasShownFirstTask.current = true;
      if (!isCompletingTask) {
        setExpandedTaskIndex(null);
      }
    }
    prevTaskRef.current = task;
  }, [task, isCompletingTask]);

  useEffect(() => {
    if (isLoading) {
      setExpandedTaskIndex(null);
    }
  }, [isLoading]);

  const isLoadingTask = !task || isLoading;
  const taskLower = task?.toLowerCase();
  const isTaskCompleted = taskLower === "done" || taskLower === "done.";

  useEffect(() => {
    if (isTaskCompleted && !hasTrackedCompletion.current) {
      hasTrackedCompletion.current = true;
      onAllTasksCompleted?.();
    }
  }, [isTaskCompleted, onAllTasksCompleted]);

  const handleSubmit = (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (input.trim()) {
      sendFollowUpMessage?.(input);
      setInput("");
    }
  };

  const handleRefreshTask = () => {
    onTaskRefreshed?.(task ?? "", totalTaskCount);
    onRefreshTask?.();
  };

  const handleExpandTask = (index: number | null) => {
    setExpandedTaskIndex(index);
  };

  const handleNextTask = (skipSkeleton = true) => {
    if (isCompletingTask) return;
    const taskToComplete = tasks[tasks.length - 1];
    setCompletingTask(taskToComplete);
    setCompletingTaskNumber(tasks.length);
    setCompletingAnimationKey(taskAnimationKey);
    setIsCompletingTask(true);
    setSkipSkeletonAnimation(skipSkeleton);
    onNextTask?.();
    setTimeout(() => {
      setIsCompletingTask(false);
      setCompletingTask(null);
    }, 2200);
  };

  useEffect(() => {
    if (skipSkeletonAnimation && task) {
      setSkipSkeletonAnimation(false);
    }
  }, [skipSkeletonAnimation, task]);

  useEffect(() => {
    if (
      autoCompleteTriggered > 0 &&
      autoCompleteTriggered !== prevAutoCompleteTriggeredRef.current
    ) {
      prevAutoCompleteTriggeredRef.current = autoCompleteTriggered;
      handleNextTask(false);
    }
  }, [autoCompleteTriggered]);

  const renderCurrentTask = () => {
    if (isCompletingTask && completingTask) {
      return (
        <TaskCard
          task={completingTask}
          taskNumber={completingTaskNumber}
          isCurrentTask
          isExpanded={isCurrentTaskExpanded}
          onToggleExpand={() => handleExpandTask(null)}
          isLoading={false}
          isLoadingPreviewImage={false}
          isAnalyzingScreen={false}
          animationKey={completingAnimationKey}
          totalTasks={completingTaskNumber}
          onRefresh={handleRefreshTask}
          onNextTask={handleNextTask}
          onStartOver={onStartOver}
          isPip={isPip}
          isCompleting={true}
        />
      );
    }

    if (isLoadingTask && (showInitialLoading || hasShownFirstTask.current)) {
      return (
        <LoadingTaskCard isPip={isPip} skipAnimation={skipSkeletonAnimation} />
      );
    }

    if (hasExceededMaxSteps) {
      return <ExceededLimitCard onStartOver={onStartOver} />;
    }

    if (currentTask) {
      return (
        <TaskCard
          task={currentTask}
          taskNumber={tasks.length}
          isCurrentTask
          isExpanded={isCurrentTaskExpanded}
          onToggleExpand={() => handleExpandTask(null)}
          isLoading={isLoading}
          isLoadingPreviewImage={isLoadingPreviewImage}
          isAnalyzingScreen={isAnalyzingScreen}
          animationKey={taskAnimationKey}
          totalTasks={tasks.length}
          onRefresh={handleRefreshTask}
          onNextTask={handleNextTask}
          onStartOver={onStartOver}
          isPip={isPip}
          isCompleting={false}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex justify-center items-center flex-col h-[100dvh]">
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 overflow-y-auto w-full text-[1.1em]">
          <div
            className={`max-w-[800px] mx-auto w-full px-4 ${
              isPip ? "py-2 mt-2" : "pt-8"
            }`}
          >
            {!isPip && (
              <>
                <div className="flex items-center justify-between">
                  <h1
                    className={`font-semibold flex-1 ${
                      (goal?.length ?? 0) < 50
                        ? "text-3xl"
                        : (goal?.length ?? 0) < 100
                        ? "text-2xl"
                        : "text-xl"
                    }`}
                  >
                    {goal}
                  </h1>
                </div>
                <div className="my-4 border-border border-t border-black" />
              </>
            )}

            {renderCurrentTask()}

            {[...historyTasks].reverse().map((historyTask, index) => {
              const originalIndex = historyTasks.length - 1 - index;
              const taskNumber = historyTasks.length - index;

              if (isCompletingTask && taskNumber === completingTaskNumber) {
                return null;
              }

              return (
                <TaskCard
                  key={`task-${originalIndex}-${historyTask.text.substring(
                    0,
                    20
                  )}`}
                  task={historyTask}
                  taskNumber={taskNumber}
                  isCurrentTask={false}
                  isExpanded={expandedTaskIndex === originalIndex}
                  onToggleExpand={() =>
                    handleExpandTask(
                      expandedTaskIndex === originalIndex ? null : originalIndex
                    )
                  }
                  onReturnHere={() => returnToTask?.(originalIndex)}
                  shouldAnimateIn={hasInitialRender.current && index === 0}
                />
              );
            })}
          </div>
        </div>

        <div
          className={`w-full flex justify-center px-4 ${
            isPip ? "pb-2" : "pb-8"
          }`}
        >
          <div className="max-w-[800px] w-full">
            <form
              className={`flex bg-background w-full ${isPip ? "mb-2" : "mb-4"}`}
            >
              <MultimodalInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoadingFollowUp}
                messages={[]}
                placeholderText="Stuck? Ask a question..."
                size={isPip ? "sm" : undefined}
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
