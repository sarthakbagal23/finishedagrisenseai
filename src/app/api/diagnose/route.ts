import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const assessmentSchema = z.object({
  likelyIssue: z.string().min(1).max(160),
  alternatives: z.array(z.string().min(1).max(120)).max(3),
  visibleSigns: z.string().min(1).max(700),
  nextStep: z.string().min(1).max(700),
  confidence: z.enum(["low", "moderate", "high"]),
});

const requestSchema = z.object({
  photoDataUri: z.string().max(7_000_000),
  cropType: z.string().trim().min(1).max(60).regex(/^[\p{L}\p{N} (),.'’-]+$/u),
});

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isAllowedImage(mime: string, image: Buffer) {
  if (mime === "image/jpeg") return image.length > 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
  if (mime === "image/png") return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/webp") return image.toString("ascii", 0, 4) === "RIFF" && image.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 7_100_000) return fail("Image must be 5 MB or smaller.", 413);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fail("Crop image screening is not configured yet.", 503);

  let raw: string;
  try {
    if (!request.body) return fail("Invalid image request.", 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let byteLength = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 7_100_000) {
        await reader.cancel();
        return fail("Image must be 5 MB or smaller.", 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    raw = new TextDecoder().decode(bytes);
  } catch {
    return fail("Could not read the image request.", 400);
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail("Invalid image request.", 400);
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return fail("Upload a JPEG, PNG, or WebP image under 5 MB.", 400);

  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(parsed.data.photoDataUri);
  if (!match) return fail("Upload a JPEG, PNG, or WebP image under 5 MB.", 400);
  const [, mime, encoded] = match;
  const image = Buffer.from(encoded, "base64");
  if (!image.length || image.length > 5 * 1024 * 1024) return fail("Image must be 5 MB or smaller.", 413);
  if (image.toString("base64") !== encoded || !isAllowedImage(mime, image)) return fail("The file contents do not match a supported image type.", 400);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
        temperature: 0.2,
        max_completion_tokens: 700,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: `Screen this ${parsed.data.cropType} crop photo for visible signs. This is an uncertain visual screening only, not a confirmed diagnosis. Do not infer unseen field conditions or claim certainty. Do not prescribe pesticides, fertilizers, or application rates. If the image is unclear or no issue is apparent, say so and suggest what clearer evidence to collect. Return only JSON with: likelyIssue (short label), alternatives (0 to 3 plausible alternatives), visibleSigns (what is visibly supported), nextStep (safe observation or local expert/extension service), confidence (low, moderate, or high; use low when uncertain).` },
            { type: "image_url", image_url: { url: parsed.data.photoDataUri } },
          ],
        }],
      }),
    });
    if (!response.ok) return fail("Image screening is temporarily unavailable. Please try again later.", response.status === 429 ? 429 : 502);
    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fail("The image screening returned an unreadable result. Please try again.", 502);
    let decoded: unknown;
    try { decoded = JSON.parse(content); } catch { return fail("The image screening returned an unreadable result. Please try again.", 502); }
    const assessment = assessmentSchema.safeParse(decoded);
    if (!assessment.success) return fail("The image screening returned an incomplete result. Please try again.", 502);
    return NextResponse.json(assessment.data, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return controller.signal.aborted
      ? fail("Image screening timed out. Please try again.", 504)
      : fail("Image screening could not connect. Please try again.", 502);
  } finally {
    clearTimeout(timeout);
  }
}
