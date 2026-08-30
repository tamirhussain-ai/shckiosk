import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  UpdateKioskContentBody,
  ResetKioskContentBody,
} from "@workspace/api-zod";
import type { KioskContent } from "@workspace/api-zod";
import { kioskContentDefaults } from "./kiosk-content-defaults";

const contentFile = path.resolve(__dirname, "../data/kiosk-content.json");
let cachedContent: KioskContent | null = null;

const cloneDefaults = (): KioskContent =>
  JSON.parse(JSON.stringify(kioskContentDefaults)) as KioskContent;

const containsBlankString = (value: unknown): boolean => {
  if (typeof value === "string") return value.trim().length === 0;
  if (value && typeof value === "object") {
    return Object.values(value).some(containsBlankString);
  }
  return false;
};

const parseContent = (value: unknown): KioskContent | null => {
  const parsed = UpdateKioskContentBody.safeParse({ content: value });
  if (!parsed.success || containsBlankString(parsed.data.content)) return null;
  return parsed.data.content;
};

async function readSavedContent(): Promise<KioskContent> {
  if (cachedContent) return cloneContent(cachedContent);

  try {
    const raw = await readFile(contentFile, "utf8");
    const parsed = parseContent(JSON.parse(raw));
    if (parsed) {
      cachedContent = parsed;
      return cloneContent(parsed);
    }
  } catch {
    // Missing or malformed content safely falls back to the explicit defaults.
  }

  cachedContent = cloneDefaults();
  return cloneContent(cachedContent);
}

const cloneContent = (content: KioskContent): KioskContent =>
  JSON.parse(JSON.stringify(content)) as KioskContent;

async function persistContent(content: KioskContent): Promise<KioskContent> {
  const validated = parseContent(content);
  if (!validated) throw new Error("Invalid kiosk content");

  await mkdir(path.dirname(contentFile), { recursive: true });
  const temporaryFile = `${contentFile}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  await rename(temporaryFile, contentFile);
  cachedContent = validated;
  return cloneContent(validated);
}

export const kioskContentStore = {
  get: readSavedContent,

  update: async (input: unknown): Promise<KioskContent | null> => {
    const parsed = UpdateKioskContentBody.safeParse(input);
    if (!parsed.success || containsBlankString(parsed.data.content)) return null;
    return persistContent(parsed.data.content);
  },

  reset: async (input: unknown): Promise<KioskContent | null> => {
    const parsed = ResetKioskContentBody.safeParse(input ?? {});
    if (!parsed.success) return null;

    if (!parsed.data.screen) return persistContent(cloneDefaults());

    const current = await readSavedContent();
    const defaults = cloneDefaults();
    const screen = parsed.data.screen;
    const next = {
      ...current,
      [screen]: defaults[screen],
    } as KioskContent;
    return persistContent(next);
  },
};