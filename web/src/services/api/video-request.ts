export type GrokVideoRequestOptions = {
    model: string;
    prompt: string;
    images: string[];
    seconds: string;
    resolution: string;
    ratio?: string;
};

/** xAI's asynchronous video creation endpoint (also exposed by Sub2API's Grok gateway). */
export const GROK_VIDEO_GENERATIONS_PATH = "/videos/generations";

export function isGrokVideoModel(model: string) {
    return /^grok-imagine-video(?:-|$)/i.test(model.trim());
}

/**
 * Extract the task identifier returned by xAI or a compatible Grok gateway.
 * xAI calls this field `request_id`; a few OpenAI-compatible relays use `id`.
 */
export function extractVideoTaskId(payload: unknown) {
    for (const path of ["request_id", "id", "data.request_id", "data.id", "video.request_id", "video.id", "task_id", "data.task_id", "video.task_id"]) {
        const value = readPath(payload, path);
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

/** Read the playable URL from both xAI's nested response and OpenAI-compatible variants. */
export function extractVideoResultUrl(payload: unknown) {
    for (const path of ["video.url", "video_url", "result_url", "url", "content.video_url", "content.url", "data.video.url", "data.video_url", "data.result_url", "data.url"]) {
        const value = readPath(payload, path);
        if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
}

/** xAI uses `done`; existing OpenAI-compatible providers commonly use `completed`. */
export function isVideoTaskDone(payload: unknown) {
    const status = readPath(payload, "status");
    return typeof status === "string" && ["done", "completed"].includes(status.trim().toLowerCase());
}

export function buildGrokVideoRequestBody(options: GrokVideoRequestOptions) {
    const duration = Number(options.seconds);
    const body: Record<string, unknown> = {
        model: options.model,
        prompt: options.prompt,
        duration: Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 8,
    };
    if (options.resolution && options.resolution !== "auto") body.resolution = options.resolution;
    if (options.ratio && options.ratio !== "auto") body.aspect_ratio = options.ratio;
    if (options.images.length === 1) {
        body.image = { url: options.images[0] };
    } else if (options.images.length > 1) {
        body.images = options.images.map((url) => ({ url }));
    }
    return body;
}

function readPath(payload: unknown, path: string): unknown {
    let current: unknown = payload;
    for (const segment of path.split(".")) {
        if (!current || typeof current !== "object" || !(segment in current)) return undefined;
        current = (current as Record<string, unknown>)[segment];
    }
    return current;
}
