import { RefreshCw } from "@geist-ui/icons";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  TaskCardBaseProps,
  TASK_CARD_BASE_CLASS,
  getTaskAnimationClass,
} from "./types";

export const TaskCardBase = ({
  children,
  animationKey = 0,
  taskHistoryLength = 0,
  showRefreshButton = false,
  onRefresh,
  actionButton,
  className = "",
  isAnalyzingScreen = false,
  footer,
  decreasePaddingButton,
}: TaskCardBaseProps) => {
  const animationClass = getTaskAnimationClass(taskHistoryLength, animationKey);
  const [showIndicator, setShowIndicator] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isDoneDisabled, setIsDoneDisabled] = useState(false);

  useEffect(() => {
    const storage = localStorage.getItem("disabledone");

    console.log("storage", storage);
    setIsDoneDisabled(!!storage);
  }, []);

  useEffect(() => {
    if (isAnalyzingScreen) {
      setShowIndicator(true);
      setIsFadingOut(false);
    } else if (showIndicator) {
      setIsFadingOut(true);
      const timer = setTimeout(() => {
        setShowIndicator(false);
        setIsFadingOut(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isAnalyzingScreen]);

  return (
    <div
      key={animationKey}
      className={`${TASK_CARD_BASE_CLASS} ${animationClass} ${className} ${
        decreasePaddingButton && isDoneDisabled ? "pb-0" : ""
      }`}
    >
      {showRefreshButton && onRefresh && (
        <Button
          onClick={onRefresh}
          icon={<RefreshCw />}
          variant="ghost"
          className="float-right -mt-1 -mr-1"
        />
      )}
      {children}
      {actionButton && !isDoneDisabled && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            size="sm"
            onClick={actionButton.onClick}
            leftIcon={actionButton.icon}
            disabled={actionButton.disabled}
          >
            {actionButton.label}
          </Button>
          {showIndicator && (
            <span
              className={`text-sm text-foreground/60 ${
                isFadingOut ? "animate-fade-out" : "animate-fade-in-pulse"
              }`}
            >
              Detecting changes...
            </span>
          )}
        </div>
      )}
      {footer}
    </div>
  );
};
