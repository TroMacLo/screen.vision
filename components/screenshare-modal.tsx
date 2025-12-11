"use client";

import { motion } from "framer-motion";
import { Monitor, X } from "@geist-ui/icons";
import { Button } from "./ui/button";

interface ScreenshareModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const ScreenshareModal = ({
  isOpen,
  onConfirm,
  onClose,
  isLoading = false,
}: ScreenshareModalProps) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-500 hover:text-black transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Monitor size={64} />
          </div>

          <h2 className="text-2xl font-semibold text-black mb-3">
            Share your screen
          </h2>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Please share your screen so we can see the issue and guide you
            through the solution. <br />
            <u>We don&apos;t store any of your screen data. </u>
          </p>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full bg-black text-white hover:bg-gray-800 py-6 text-lg font-medium rounded-md transition-colors"
          >
            {isLoading ? "Starting..." : "Get Started"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
