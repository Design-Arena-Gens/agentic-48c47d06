export type VeoGenerateRequest = {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string; // e.g., "16:9"
  durationSeconds?: number; // 1..60
  fps?: number; // 24, 30, 60
  resolution?: string; // e.g., "7680x4320"
  seed?: number;
};

export type VeoGenerateResponse = {
  operationName?: string;
  status?: string;
  videoUrl?: string;
};

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const BASE_URL = process.env.VEO_BASE_URL || "https://generativelanguage.googleapis.com/v1beta";
const MODEL = process.env.VEO_MODEL || "veo-3.1";

// Assumes a Google Generative Language API-style endpoint for Veo 3.1
// POST {BASE_URL}/models/{MODEL}:generateVideo
export async function submitVeoJob(req: VeoGenerateRequest): Promise<VeoGenerateResponse> {
  if (!GOOGLE_API_KEY) {
    // Fallback mock for environments without key
    return { operationName: `mock-op-${Date.now()}`, status: "queued" };
  }

  const payload = {
    prompt: req.prompt,
    negative_prompt: req.negativePrompt,
    video_config: {
      aspect_ratio: req.aspectRatio || "16:9",
      duration_seconds: req.durationSeconds || 8,
      fps: req.fps || 24,
      resolution: req.resolution || "7680x4320",
      seed: req.seed,
      style: "cinematic"
    }
  } as any;

  const url = `${BASE_URL}/models/${encodeURIComponent(MODEL)}:generateVideo?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Veo submit failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  // Expecting either direct video or operation for async generation
  if (data?.video?.uri) {
    return { videoUrl: data.video.uri, status: "completed" };
  }
  if (data?.operation || data?.name) {
    return { operationName: data.operation?.name || data.name, status: data.operation?.status || "processing" };
  }
  return { status: "submitted" };
}

// Poll operation status: GET {BASE_URL}/{operationName}
export async function pollVeoOperation(operationName: string): Promise<VeoGenerateResponse> {
  if (!GOOGLE_API_KEY) {
    // Mock behavior: after ~3 polls return a demo URL
    const demo = process.env.DEMO_VIDEO_URL || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
    return { videoUrl: demo, status: "completed" };
  }

  const url = `${BASE_URL}/${encodeURIComponent(operationName)}?key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Veo poll failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (data?.done && (data?.result?.video?.uri || data?.response?.video?.uri)) {
    const uri = data.result?.video?.uri || data.response?.video?.uri;
    return { videoUrl: uri, status: "completed" };
  }
  if (data?.metadata?.status) {
    return { status: data.metadata.status };
  }
  return { status: "processing" };
}
