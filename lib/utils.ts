import { UIMessage } from "@ai-sdk/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { id } from "zod/v4/locales";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getSystemInfo() {
  if (typeof window === "undefined") {
    return {
      browser: {
        browserName: "Unknown",
        browserVersion: "Unknown",
        userAgent: "Unknown",
      },
      os: {
        osName: "Unknown",
        osVersion: "Unknown",
        platform: "Unknown",
      },
      screen: {
        width: 0,
        height: 0,
        availWidth: 0,
        availHeight: 0,
        colorDepth: 0,
      },
      viewport: {
        width: 0,
        height: 0,
      },
      language: "en-US",
      languages: ["en-US"],
      online: true,
      cookieEnabled: true,
      hardwareConcurrency: 1,
    };
  }

  const userAgent = navigator.userAgent;

  return {
    browser: getBrowserInfo(),
    os: getOSInfo(),
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    language: navigator.language,
    languages: navigator.languages,
    online: navigator.onLine,
    cookieEnabled: navigator.cookieEnabled,
    hardwareConcurrency: navigator.hardwareConcurrency, // CPU cores
  };
}

// Helper functions
function getBrowserInfo() {
  if (typeof window === "undefined") {
    return { browserName: "Unknown", browserVersion: "Unknown", userAgent: "" };
  }
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let browserVersion = "Unknown";

  if (userAgent.indexOf("Chrome") > -1 && userAgent.indexOf("Edg") === -1) {
    browserName = "Chrome";
    browserVersion = userAgent.match(/Chrome\/(\d+\.\d+)/)?.[1] || "Unknown";
  } else if (userAgent.indexOf("Edg") > -1) {
    browserName = "Edge";
    browserVersion = userAgent.match(/Edg\/(\d+\.\d+)/)?.[1] || "Unknown";
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Firefox";
    browserVersion = userAgent.match(/Firefox\/(\d+\.\d+)/)?.[1] || "Unknown";
  } else if (
    userAgent.indexOf("Safari") > -1 &&
    userAgent.indexOf("Chrome") === -1
  ) {
    browserName = "Safari";
    browserVersion = userAgent.match(/Version\/(\d+\.\d+)/)?.[1] || "Unknown";
  }

  return { browserName, browserVersion, userAgent };
}

function getOSInfo() {
  if (typeof window === "undefined") {
    return { osName: "Unknown", osVersion: "Unknown", platform: "Unknown" };
  }
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  let osName = "Unknown";
  let osVersion = "Unknown";

  if (userAgent.indexOf("Windows") > -1) {
    osName = "Windows";
    if (userAgent.indexOf("Windows NT 10.0") > -1) osVersion = "10/11";
  } else if (userAgent.indexOf("Mac OS X") > -1) {
    osName = "macOS";
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    if (match) osVersion = match[1].replace(/_/g, ".");
  } else if (userAgent.indexOf("Linux") > -1) {
    osName = "Linux";
  } else if (
    userAgent.indexOf("iPhone") > -1 ||
    userAgent.indexOf("iPad") > -1
  ) {
    osName = "iOS";
    const match = userAgent.match(/OS (\d+_\d+)/);
    if (match) osVersion = match[1].replace(/_/g, ".");
  } else if (userAgent.indexOf("Android") > -1) {
    osName = "Android";
    const match = userAgent.match(/Android (\d+\.\d+)/);
    if (match) osVersion = match[1];
  }

  return { osName, osVersion, platform };
}

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
};

export const calculateSimilarity = (str1: string, str2: string): number => {
  if (!str1 || !str2) return 0;

  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1;
  if (s1.slice(0, 40) === s2.slice(0, 40)) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  return 1 - distance / Math.max(len1, len2);
};

export const isSimilarToString = (
  newTask: string,
  current: string,
  threshold = 0.7
): boolean => {
  return calculateSimilarity(newTask, current) >= threshold;
};
