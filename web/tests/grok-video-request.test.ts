import { expect, test } from "bun:test";

import {
    GROK_VIDEO_GENERATIONS_PATH,
    buildGrokVideoRequestBody,
    extractVideoResultUrl,
    extractVideoTaskId,
    isGrokVideoModel,
    isVideoTaskDone,
} from "../src/services/api/video-request";

test("recognizes Grok Imagine video models without matching unrelated video models", () => {
    expect(isGrokVideoModel("grok-imagine-video")).toBe(true);
    expect(isGrokVideoModel("grok-imagine-video-1.5")).toBe(true);
    expect(isGrokVideoModel("sora-2")).toBe(false);
});

test("builds the JSON body expected by the Grok video endpoint", () => {
    expect(
        buildGrokVideoRequestBody({
            model: "grok-imagine-video-1.5",
            prompt: "animate the subject",
            images: ["data:image/png;base64,aW1n"],
            seconds: "6",
            resolution: "720p",
            ratio: "16:9",
        }),
    ).toEqual({
        model: "grok-imagine-video-1.5",
        prompt: "animate the subject",
        duration: 6,
        resolution: "720p",
        aspect_ratio: "16:9",
        image: { url: "data:image/png;base64,aW1n" },
    });
});

test("uses the xAI generations endpoint and request_id response shape", () => {
    expect(GROK_VIDEO_GENERATIONS_PATH).toBe("/videos/generations");
    expect(extractVideoTaskId({ request_id: "req_123", status: "pending" })).toBe("req_123");
    expect(extractVideoTaskId({ data: { request_id: "req_nested" } })).toBe("req_nested");
});

test("recognizes the official done status and nested video URL", () => {
    const response = { status: "done", video: { url: "https://vidgen.x.ai/video.mp4" } };
    expect(isVideoTaskDone(response)).toBe(true);
    expect(extractVideoResultUrl(response)).toBe("https://vidgen.x.ai/video.mp4");
});
