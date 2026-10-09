/**
 * Contact form endpoint.
 *
 * Runs as a Vercel serverless function at POST /api/contact, and is also mounted
 * on the local Express dev server (see server/_core/index.ts), so there is one
 * code path in both places.
 *
 * Sends the enquiry to your inbox through Gmail SMTP. No custom domain needed.
 * Required env vars:
 *   GMAIL_USER          your Gmail address (the account that sends the email)
 *   GMAIL_APP_PASSWORD  a 16-character Google "App password" (NOT your normal password)
 * Optional:
 *   CONTACT_TO_EMAIL    where enquiries are delivered (defaults to GMAIL_USER)
 */
import nodemailer from "nodemailer";
import { z } from "zod";

const contactInput = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().min(1, "Please enter your email.").max(320).email("That email address doesn't look right."),
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters).").max(5000),
  // Honeypot: real visitors never see this field; bots tend to fill it in.
  website: z.string().max(200).optional(),
});

// Best-effort rate limit. On serverless this only holds while an instance stays warm,
// so it blunts casual abuse but is not a hard guarantee.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function allowRequest(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter(t => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// Strip CR/LF so visitor input can never inject extra email headers.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

type Req = { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } };
type Res = { status(code: number): Res; json(body: unknown): unknown; setHeader(name: string, value: string): unknown };

function clientIp(req: Req): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket?.remoteAddress || "unknown";
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  let raw = req.body;
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch { raw = undefined; }
  }
  const parsed = contactInput.safeParse(raw);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Please check the form and try again." });
  }
  const input = parsed.data;

  // Honeypot tripped: pretend it worked so bots learn nothing.
  if (input.website) return res.status(200).json({ ok: true });

  if (!allowRequest(clientIp(req))) {
    return res.status(429).json({ error: "You've sent a few messages already. Please try again in a bit." });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.error("[contact] GMAIL_USER / GMAIL_APP_PASSWORD are not set.");
    return res.status(500).json({ error: "The contact form isn't set up yet. Please try again later." });
  }

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `"Portfolio contact form" <${user}>`,
      to: process.env.CONTACT_TO_EMAIL || user,
      replyTo: { name: oneLine(input.name), address: input.email },
      subject: `Portfolio enquiry from ${oneLine(input.name)}`,
      text: `Name: ${oneLine(input.name)}\nEmail: ${input.email}\n\n${input.message}`,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[contact] Failed to send email:", error);
    return res.status(500).json({ error: "Sorry, your message couldn't be sent right now. Please try again later." });
  }
}
