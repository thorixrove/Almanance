import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExtractedTransaction } from "@/types/transaction";

export type { ExtractedTransaction } from "@/types/transaction";

// Semua pemanggilan Groq dilakukan di Supabase Edge Function
// "extract-transaction". API key Groq hanya ada di server (secret
// GROQ_API_KEY), tidak pernah ada di aplikasi.
const FUNCTION_NAME = "extract-transaction";

async function invokeExtraction(
  supabase: SupabaseClient,
  kind: "receipt" | "voice",
  fileUri: string,
  mimeType: string

): Promise<ExtractedTransaction> {
  const extension = mimeType.split("/")[1] ?? "bin";
  const form = new FormData()
  form.append("kind", kind)
  form.append("file", {
    uri: fileUri,
    name: `${kind}.${extension}`,
    type: mimeType,
  } as unknown as Blob)

  const { data: result, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: form,
  })

  if (error) {
    let detail = error.message
    const context = (error as { context?: Response }).context
    if (context && typeof context.json === "function") {
      try {
        const body = await context.json()
        if (body?.error) detail = body.error
      } catch (error) {

      }
    }
    throw new Error(detail)
  }

  if (!result) throw new Error("Empty response from extraction function");
  return result as ExtractedTransaction;
}

export async function extractTransactionFromReceipt(
  supabase: SupabaseClient,
  base64Image: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  return invokeExtraction(supabase, "receipt", base64Image, mimeType);
}

export async function extractTransactionFromVoice(
  supabase: SupabaseClient,
  base64Audio: string,
  mimeType: string
): Promise<ExtractedTransaction> {
  return invokeExtraction(supabase, "voice", base64Audio, mimeType);
}