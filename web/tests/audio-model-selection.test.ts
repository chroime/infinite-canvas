import { afterAll, expect, test } from "bun:test";

const values = new Map<string, string>();
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
    },
});

afterAll(() => {
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
});

const { defaultConfig } = await import("../src/stores/use-config-store");
const { resolveAudioRequestConfig } = await import("../src/services/api/audio");

test("audio requests resolve the channel selected by audioModel", () => {
    const config = {
        ...defaultConfig,
        model: "images::gpt-image-2",
        audioModel: "voice::grok-voice-tts",
        channels: [
            {
                id: "images",
                name: "Images",
                baseUrl: "https://images.example.com",
                apiKey: "images-key",
                apiFormat: "openai" as const,
                models: [{ name: "gpt-image-2", capability: "image" as const }],
            },
            {
                id: "voice",
                name: "Voice",
                baseUrl: "https://voice.example.com",
                apiKey: "voice-key",
                apiFormat: "openai" as const,
                models: [{ name: "grok-voice-tts", capability: "audio" as const }],
            },
        ],
    };

    const resolved = resolveAudioRequestConfig(config);

    expect(resolved.model).toBe("grok-voice-tts");
    expect(resolved.baseUrl).toBe("https://voice.example.com");
    expect(resolved.apiKey).toBe("voice-key");
});
