"use client";

import { useCallback, useEffect, useState } from "react";
import { driver, type DriveStep, type Side, type Alignment } from "driver.js";
import "driver.js/dist/driver.css";
import { useTranslations } from "next-intl";

type TourStepInput = {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: string;
    align?: string;
  };
};

type GuideTourProps = {
  tourSteps: unknown;
  guideId: string;
};

const isValidTourSteps = (steps: unknown): steps is TourStepInput[] => {
  if (!Array.isArray(steps)) return false;
  return steps.every(
    (step) =>
      typeof step === "object" &&
      step !== null &&
      typeof step.element === "string" &&
      typeof step.popover === "object" &&
      step.popover !== null &&
      typeof step.popover.title === "string" &&
      typeof step.popover.description === "string"
  );
};

const getStorageKey = (guideId: string): string =>
  `guide-tour-${guideId}`;

const GuideTour = ({ tourSteps, guideId }: GuideTourProps) => {
  const t = useTranslations("guides");
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const key = getStorageKey(guideId);
    const stored = localStorage.getItem(key);
    if (stored === "true") {
      setHasCompleted(true);
    }
  }, [guideId]);

  const handleStartTour = useCallback(() => {
    if (!isValidTourSteps(tourSteps)) return;

    const steps: DriveStep[] = tourSteps.map((step) => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        ...(step.popover.side ? { side: step.popover.side as Side } : {}),
        ...(step.popover.align ? { align: step.popover.align as Alignment } : {}),
      },
    }));

    const driverObj = driver({
      showProgress: true,
      steps,
      onDestroyed: () => {
        const key = getStorageKey(guideId);
        localStorage.setItem(key, "true");
        setHasCompleted(true);
      },
    });

    driverObj.drive();
  }, [tourSteps, guideId]);

  if (!isValidTourSteps(tourSteps)) return null;

  return (
    <button
      onClick={handleStartTour}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        hasCompleted
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-lamaPurple text-white hover:bg-lamaPurpleDark"
      }`}
    >
      {hasCompleted ? t("tourCompleted") : t("startTour")}
    </button>
  );
};

export default GuideTour;
