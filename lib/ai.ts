import axios from "axios";

export const aiApiUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
export const stepApiUrl = aiApiUrl + "/step";
export const helpApiUrl = aiApiUrl + "/help";
export const checkApiUrl = aiApiUrl + "/check";
export const coordinatesApiUrl = aiApiUrl + "/coordinates";

export const chatId = crypto.randomUUID();

export async function readStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onStream?: (message: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let result = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

        if (trimmedLine.startsWith("data: ")) {
          const dataContent = trimmedLine.slice(6);
          try {
            const parsed = JSON.parse(dataContent);
            if (parsed.type === "text-delta") {
              result += parsed.delta;
              onStream?.(result);
            }
          } catch (e) {
            console.error("Error parsing JSON:", e);
          }
        }
      }
    }

    if (buffer.trim()) {
      const trimmedLine = buffer.trim();
      if (trimmedLine.startsWith("data: ") && trimmedLine !== "data: [DONE]") {
        const dataContent = trimmedLine.slice(6);
        try {
          const parsed = JSON.parse(dataContent);
          if (parsed.type === "text-delta") {
            result += parsed.delta;
          }
        } catch (e) {
          console.error("Error parsing JSON from buffer:", e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return result;
}

export interface FollowUpContext {
  previousImage: string;
  previousInstruction: string;
  followUpMessage: string;
}

export async function generateAction(
  goal: string,
  base64Image: string,
  completedSteps?: string[],
  roughPlan?: string,
  osName?: string,
  followUpContext?: FollowUpContext
) {
  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        stepApiUrl,
        {
          goal,
          image: base64Image,
          os_name: osName,
          completed_steps: completedSteps,
          follow_up_context: followUpContext
            ? {
                previous_image: followUpContext.previousImage,
                previous_instruction: followUpContext.previousInstruction,
                follow_up_message: followUpContext.followUpMessage,
              }
            : undefined,
        },
        {
          responseType: "stream",
          adapter: "fetch",
        }
      );

      const reader = response.data?.getReader();
      if (!reader) return "";

      const text = await readStream(reader);

      return text;
    } catch (e) {
      lastError = e;
      console.error(
        `Error generating action (attempt ${attempt + 1}/${maxRetries + 1}):`,
        e
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }
  }

  console.error("All retry attempts failed for generateAction:", lastError);
  return "";
}

export async function generateHelpResponse(
  goal: string,
  base64Image: string,
  userQuestion: string,
  previousMessage: string,
  onStream?: (message: string) => void
) {
  try {
    const response = await axios.post(
      helpApiUrl,
      {
        goal,
        image: base64Image,
        user_question: userQuestion,
        previous_message: previousMessage || undefined,
      },
      {
        responseType: "stream",
        adapter: "fetch",
      }
    );

    const reader = response.data?.getReader();
    if (!reader) return "";

    const text = await readStream(reader, onStream);

    return text;
  } catch (e) {
    console.error("Error generating help response:", e);
    return "";
  }
}

export async function checkStepCompletion(
  currentInstruction: string,
  lastBase64Image: string,
  currentBase64Image: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      checkApiUrl,
      {
        instruction: currentInstruction,
        before_image: lastBase64Image,
        after_image: currentBase64Image,
      },
      {
        responseType: "stream",
        adapter: "fetch",
      }
    );

    const reader = response.data?.getReader();
    if (!reader) return false;

    const text = await readStream(reader);

    const cleanText = text.replace(/```json\n|\n```/g, "").trim();

    try {
      const result = JSON.parse(cleanText);
      console.log(result);
      return result.status === "Yes";
    } catch (parseError) {
      console.error("Failed to parse check completion JSON:", text);
      return text.includes('"status": "Yes"');
    }
  } catch (e) {
    console.error("Error checking step completion:", e);
    return false;
  }
}

export async function generateCoordinate(
  instruction: string,
  base64Image: string
) {
  try {
    const response = await axios.post(
      coordinatesApiUrl,
      {
        instruction,
        image: base64Image,
      },
      {
        responseType: "stream",
        adapter: "fetch",
      }
    );

    const reader = response.data?.getReader();
    if (!reader) return "None";

    const text = await readStream(reader);
    const normalizedCoords = text.trim();

    return normalizedCoords;
  } catch (e) {
    console.error("Error generating coordinates:", e);
    return "None";
  }
}

interface Coordinates {
  x: number;
  y: number;
}

export const parseCoordinates = (output: string): Coordinates => {
  const [xStr, yStr] = output.split(",");
  return {
    x: parseInt(xStr, 10),
    y: parseInt(yStr, 10),
  };
};

export const createCoordinateSnapshot = async (
  imageDataUrl: string,
  { x, y }: Coordinates,
  sizePercentY = 15,
  xToYRatio = 2.5
): Promise<string | null> => {
  if (x < 0 || y < 0) return null;

  const img = new Image();
  img.src = imageDataUrl;
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
  });

  const sizePercentX = sizePercentY * xToYRatio;
  const outputWidth = Math.round((sizePercentX / 100) * img.width);
  const outputHeight = Math.round((sizePercentY / 100) * img.height);

  const imageX = (x / 999) * img.width;
  const imageY = (y / 999) * img.height;

  const halfCropX = outputWidth / 2;
  const halfCropY = outputHeight / 2;

  const cropX = Math.max(
    0,
    Math.min(imageX - halfCropX, img.width - outputWidth)
  );
  const cropY = Math.max(
    0,
    Math.min(imageY - halfCropY, img.height - outputHeight)
  );

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    img,
    cropX,
    cropY,
    outputWidth,
    outputHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  const cursorX = imageX - cropX + 5;
  const cursorY = imageY - cropY - 5;

  const cursorImg = new Image();
  cursorImg.src = "/cursor.png";
  await new Promise<void>((resolve) => {
    cursorImg.onload = () => resolve();
  });

  const cursorSize = 50;
  ctx.drawImage(cursorImg, cursorX, cursorY, cursorSize, cursorSize);

  return canvas.toDataURL("image/png");
};
