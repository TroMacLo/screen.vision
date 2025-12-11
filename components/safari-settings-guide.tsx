"use client";

import { Button } from "./ui/button";

interface SafariSettingsGuideProps {
  onComplete: () => void;
}

export const SafariSettingsGuide = ({
  onComplete,
}: SafariSettingsGuideProps) => {
  const steps = [
    {
      number: 1,
      title: "Open Safari Menu",
      description:
        'Click on "Safari" in the top menu bar at the top-left of your screen',
    },
    {
      number: 2,
      title: "Open Site Settings",
      description: `Click on "Settings for screen.vision..." in the menu`,
    },
    {
      number: 3,
      title: "Allow Pop-up Windows",
      description: 'Find "Pop-up Windows" and change the dropdown to "Allow"',
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-black/10 overflow-hidden">
        {/* Header */}
        <div className=" px-6 py-4">
          <h2 className="text-black font-semibold text-xl">
            Safari Setup Required
          </h2>
          <p className="text-black/70 text-sm">
            Enable pop-ups for the best experience
          </p>
        </div>

        {/* Instructions */}
        <div className="px-6 py-6 space-y-6">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-medium">
                {step.number}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h3 className="text-base font-semibold text-black">
                  {step.title}
                </h3>
                <p className="text-black/60 text-sm mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action */}
        <div className="px-6 pb-6">
          <Button
            onClick={onComplete}
            className="w-full bg-black hover:bg-black/80 text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
