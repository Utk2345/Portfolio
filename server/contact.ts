import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
import { saveContactMessage } from "./db";

export const contactInput = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().min(1, "Please enter your email.").max(320).email("That email address doesn't look right."),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(5000),
  // Honeypot: real visitors never see or fill this field; bots usually do.
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactInput>;

// --- Simple in-memory rate limit (per IP). Good enough for a portfolio site. ---
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientIp(req: { headers: Record<string, unknown>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : undefined;
  return first || req.socket?.remoteAddress || "unknown";
}

// Strip CR/LF so user input can never inject extra email headers.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

async function sendEmail(input: ContactInput): Promise<boolean> {
  if (!ENV.resendApiKey || !ENV.contactToEmail) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: ENV.contactFromEmail,
        to: [ENV.contactToEmail],
        reply_to: input.email,
        subject: `Portfolio enquiry from ${oneLine(input.name)}`,
        text: `Name: ${oneLine(input.name)}\nEmail: ${input.email}\n\n${input.message}`,
      }),
    });
    if (!response.ok) {
      console.warn(`[Contact] Resend rejected the email (${response.status}): ${await response.text().catch(() => "")}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Contact] Failed to send email:", error);
    return false;
  }
}

async function sendOwnerNotification(input: ContactInput): Promise<boolean> {
  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) return false;
  try {
    return await notifyOwner({
      title: `New portfolio enquiry from ${oneLine(input.name)}`,
      content: `From: ${oneLine(input.name)} <${input.email}>\n\n${input.message}`,
    });
  } catch (error) {
    console.warn("[Contact] Owner notification failed:", error);
    return false;
  }
}

/**
 * Delivers an enquiry through every configured channel (email, owner
 * notification, database). The request succeeds if at least one channel
 * accepted it, so a message is never silently lost.
 */
export async function deliverContactMessage(input: ContactInput): Promise<void> {
  const [emailed, notified] = await Promise.all([sendEmail(input), sendOwnerNotification(input)]);
  const stored = await saveContactMessage({
    name: input.name,
    email: input.email,
    message: input.message,
    delivered: emailed || notified,
  });

  if (!emailed && !notified && !stored) {
    console.error("[Contact] No delivery channel succeeded. Configure RESEND_API_KEY + CONTACT_TO_EMAIL, or DATABASE_URL.");
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Sorry, your message couldn't be sent right now. Please try again later.",
    });
  }
}
