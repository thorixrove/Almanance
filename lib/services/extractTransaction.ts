import {
  CATEGORY_KEYS_EXPENSE,
  CATEGORY_KEYS_INCOME,
} from "@/constants/categories";
import type { ExtractedTransaction } from "@/types/transaction";

export type { ExtractedTransaction } from "@/types/transaction";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Vision-capable model, used to read receipt photos.
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";
// Text-only model, used to extract structured fields from a transcript.
// Supports strict JSON Schema structured outputs.
const GROQ_TEXT_MODEL = "openai/gpt-oss-120b";
// Whisper model for speech-to-text.
const GROQ_STT_MODEL = "whisper-large-v3-turbo";

// Structured output schema (strict mode). Groq's strict mode requires every
// property to be listed in "required" and additionalProperties: false.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    type: { type: ["string", "null"], enum: ["EXPENSE", "INCOME", null] },
    amount: { type: ["number", "null"] },
    category: {
      type: ["string", "null"],
      enum: [...CATEGORY_KEYS_EXPENSE, ...CATEGORY_KEYS_INCOME, null],
    },
    description: { type: ["string", "null"] },
    date: { type: ["string", "null"] },
    transcript: { type: ["string", "null"] },
  },
  required: ["type", "amount", "category", "description", "date", "transcript"],
  additionalProperties: false,
};

function getApiKey() {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY");
  return apiKey;
}

// Text-only extraction, with strict JSON Schema enforcement.
async function callGroqStructured(promptText: string): Promise<ExtractedTransaction> {
  const apiKey = getApiKey();

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_TEXT_MODEL,
      messages: [{ role: "user", content: promptText }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "extracted_transaction",
          strict: true,
          schema: RESPONSE_SCHEMA,
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq request failed: ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from Groq");

  return JSON.parse(text) as ExtractedTransaction;
}

// Vision extraction (receipt photo). The vision model is used together with
// a plain json_object response format rather than strict json_schema, since
// strict-schema + vision support varies; the prompt spells out the exact
// keys expected instead.
async function callGroqVision(
  promptText: string,
  image: { mimeType: string; data: string }
): Promise<ExtractedTransaction> {
  const apiKey = getApiKey();

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            {
              type: "image_url",
              image_url: { url: `data:${image.mimeType};base64,${image.data}` },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq vision request failed: ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("No response from Groq");

  return JSON.parse(text) as ExtractedTransaction;
}

// Transcribes a voice note via Groq's Whisper endpoint. Like other
// providers, Groq's chat/completions endpoint doesn't accept raw audio
// directly — audio has to go through the dedicated /audio/transcriptions
// endpoint first.
async function transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
  const apiKey = getApiKey();

  const extension = mimeType.split("/")[1] ?? "m4a";
  const form = new FormData();
  // React Native's fetch/FormData expects a { uri, type, name } object
  // rather than a Blob for file uploads.
  form.append("file", {
    uri: `data:${mimeType};base64,${base64Audio}`,
    type: mimeType,
    name: `voice-note.${extension}`,
  } as unknown as Blob);
  form.append("model", GROQ_STT_MODEL);
  form.append("response_format", "json");

  const res = await fetch(GROQ_STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq STT request failed: ${errText}`);
  }

  const data = await res.json();
  const transcript = data?.text;
  if (!transcript) throw new Error("No transcript from Groq STT");

  return transcript as string;
}

export async function extractTransactionFromReceipt(
  base64Image: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  const prompt = `You are reading a receipt photo for a personal finance app. Extract the transaction details.

Respond with ONLY a JSON object (no markdown, no extra text) with exactly these keys: "type", "amount", "category", "description", "date", "transcript".

- "type" is always "EXPENSE" for a receipt.
- "amount" is the final total paid (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}.
- "description" is a short label, ideally the merchant/store name.
- "date" is the receipt date in YYYY-MM-DD format, if visible, otherwise null.
- "transcript" should be null.
- If any field can't be confidently determined from the image, set it to null. Do not guess.`;

  return callGroqVision(prompt, { mimeType, data: base64Image });
}

export async function extractTransactionFromVoice(
  base64Audio: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  const today = new Date().toISOString().slice(0, 10);

  // Step 1: transcribe the audio to text.
  const transcript = await transcribeAudio(base64Audio, mimeType);

  // Step 2: extract structured fields from the transcript text.
  const prompt = `You are reading a transcript of a short voice note for a personal finance app where the user is logging a transaction (e.g. "I spent 400 on groceries yesterday" or "Got 5000 rupees freelance payment today"). Today's date is ${today}.

Transcript: "${transcript}"

Extract the transaction details.

- "type" is "EXPENSE" or "INCOME" based on what the user said.
- "amount" is the amount mentioned (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}, ${CATEGORY_KEYS_INCOME.join(", ")} (pick from the expense list if type is EXPENSE, income list if INCOME).
- "description" is a short label summarizing what it was for.
- "date" should be null unless the user clearly mentioned a specific date (e.g. "yesterday", "on Monday") — resolve relative dates to YYYY-MM-DD using ${today} as today's date.
- "transcript" must be exactly the transcript text given above.
- If any field can't be confidently determined, set it to null. Do not guess.`;

  const result = await callGroqStructured(prompt);
  // Use the real transcript from the STT step rather than trusting the
  // chat model to echo it back verbatim.
  return { ...result, transcript };
}