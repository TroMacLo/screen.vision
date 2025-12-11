"use client";

import { Airplay } from "@geist-ui/icons";
import { useScreenShare } from "@/hooks/screenshare";

export const ScreenshareButton = () => {
  const { isSharing, requestScreenShare, stopSharing } = useScreenShare();

  const handleScreenShare = async () => {
    if (isSharing) {
      stopSharing();
      return;
    }

    await requestScreenShare();
  };

  return (
    <>
      <button
        onClick={handleScreenShare}
        className="bg-primary flex gap-2 items-center text-white px-4 py-2 rounded-md text-lg"
      >
        <Airplay size={24} />
        {isSharing ? "Stop Sharing" : "Share Your Screen"}
      </button>
    </>
  );
};
