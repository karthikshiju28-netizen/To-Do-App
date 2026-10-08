import { GoogleGenAI } from "@google/genai";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompt";
import { modelJsonSchema, modelOutputSchema, type ExtractionContext, type ModelOutput } from "./types";

// Tried in order. If a model is overloaded (503) or rate limited (429) we retry briefly, then move to the next.
const MODELS = [process.env.GEMINI_MODEL || "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite"];
export const GEMINI_MODEL = MODELS[0];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isBusy = (e: unknown) => /\b(503|429|500)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(String(e));

export class ExtractionError extends Error {}

/** Sends one document to Gemini and returns its structured answer. */
export async function runGemini(
  file: { bytes: Uint8Array; mimeType: string },
  ctx: ExtractionContext,
): Promise<ModelOutput & { model: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ExtractionError("The server is missing GEMINI_API_KEY.");
  const ai = new GoogleGenAI({ apiKey });

  const isText = file.mimeType.startsWith("text/");
  const filePart = isText
    ? { text: `--- DOCUMENT START ---\n${new TextDecoder().decode(file.bytes)}\n--- DOCUMENT END ---` }
    : { inlineData: { mimeType: file.mimeType, data: Buffer.from(file.bytes).toString("base64") } };

  let text: string | undefined;
  let usedModel = MODELS[0];
  let lastError: unknown;
  outer: for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ text: buildUserPrompt(ctx) }, filePart] }],
          config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseJsonSchema: modelJsonSchema,
            temperature: 0,
          },
        });
        text = res.text;
        usedModel = model;
        break outer;
      } catch (e) {
        lastError = e;
        console.error(`Gemini request failed (${model}, try ${attempt + 1}):`, String(e).slice(0, 300));
        if (!isBusy(e)) break outer; // a real error (bad key, bad file): retrying won't help
        await sleep(1500);
      }
    }
  }
  if (text === undefined && lastError) throw new ExtractionError(friendlyGeminiError(lastError));
  if (!text) throw new ExtractionError("The AI returned an empty answer. Please try again.");

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ExtractionError("The AI returned something unreadable. Please try again.");
  }
  const parsed = modelOutputSchema.safeParse(json);
  if (!parsed.success) throw new ExtractionError("The AI's answer didn't match the expected format. Please try again.");
  return { ...parsed.data, model: usedModel };
}

function friendlyGeminiError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/503|UNAVAILABLE|high demand|overloaded/i.test(msg)) return "The AI service is overloaded right now. Wait a minute and retry.";
  if (/429|quota|rate/i.test(msg)) return "The AI service is busy or its free limit was reached. Wait a minute and retry.";
  if (/API key|permission|403|401/i.test(msg)) return "The AI service rejected the server's API key.";
  if (/SAFETY|blocked/i.test(msg)) return "The AI declined to read this file.";
  return "The AI service had a problem reading this file. Please try again.";
}
