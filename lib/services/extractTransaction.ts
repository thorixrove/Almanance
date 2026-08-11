import {
    CATEGORY_KEYS_EXPENSE,
    CATEGORY_KEYS_INCOME,
} from "@/constants/categories"
import type { ExtractedTransaction} from "@/types/transaction"
import { json } from "zod";

export type {ExtractedTransaction} from "@/types/transaction"

const GROK_CHAT_URL = "https://api.x.ai/v1/chat/completions";
const GROK_STT_URL = "https://api.x.ai/v1/stt";

// Vision-capable chat model used to read receipts and extract structured
// fields from a transcript.
const GROK_CHAT_MODEL = "grok-4.5";
// Dedicated speech-to-text model, used only for voice notes.
const GROK_STT_MODEL = "grok-stt";


const RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        type: {type: ["string", "null"], enum: ["EXPENSE", "INCOME", null]},
        amount: {type: ["number", "null"]},
        category: {
            type: ["string", "null"],
             enum: [...CATEGORY_KEYS_EXPENSE, ...CATEGORY_KEYS_INCOME, null],
        },
        description: {type: ["string", "null"]},
        date: {type: ["string", "null"]},
        transcript: {type: ["string", "null"]},
    },
    required: ["type", "amount", "category", "description", "date", "transcript"],
    additionalProperties: false,
}

function getApiKey() {
    const apiKey = process.env.EXPO_PUBLIC_GROK_API_KEY
    if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GROK_API_KEY")
        return apiKey
}

async function callGrokChat(
    promptText: string,
    image?: { mimeType: string; data: string}
): Promise<ExtractedTransaction> {
    const apiKey = getApiKey()

    const content: Record<string, unknown>[] = [{ type: "text", text: promptText}]
    if (image) {
        content.push({
            type: "image_url",
              image_url: { url: `data:${image.mimeType};base64,${image.data}` },
        })
    }

    const res = await fetch(GROK_CHAT_URL, {
        method: "POST",
        headers: {
             "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROK_CHAT_MODEL,
            messages: [{ role: "user", content}],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: "extracted_transactions",
                    schema: RESPONSE_SCHEMA,
                    strict: true,
                },
            },
        }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Grok request failed: ${errText}`);
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw new Error("No response from Grok")

        return JSON.parse(text) as ExtractedTransaction
}

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
  form.append("model", GROK_STT_MODEL);
 
  const res = await fetch(GROK_STT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });
 
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Grok STT request failed: ${errText}`);
  }
 
  const data = await res.json();
  const transcript = data?.text;
  if (!transcript) throw new Error("No transcript from Grok STT");
 
  return transcript as string;
}
 
export async function extractTransactionFromReceipt(
  base64Image: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  const prompt = `You are reading a receipt photo for a personal finance app. Extract the transaction details.
 
- "type" is always "EXPENSE" for a receipt.
- "amount" is the final total paid (a plain number, no currency symbols).
- "category" must be exactly one of: ${CATEGORY_KEYS_EXPENSE.join(", ")}.
- "description" is a short label, ideally the merchant/store name.
- "date" is the receipt date in YYYY-MM-DD format, if visible.
- "transcript" should be null.
- If any field can't be confidently determined from the image, set it to null. Do not guess.`;
 
  return callGrokChat(prompt, { mimeType, data: base64Image });
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
 
  const result = await callGrokChat(prompt);
  // Use the real transcript from the STT step rather than trusting the
  // chat model to echo it back verbatim.
  return { ...result, transcript };
}
 