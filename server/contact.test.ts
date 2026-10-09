import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMail = vi.fn(async () => ({}));
vi.mock("nodemailer", () => ({ default: { createTransport: vi.fn(() => ({ sendMail })) } }));

import handler from "../api/contact";

function call(body: unknown, { method = "POST", ip = "1.1.1.1" } = {}) {
  const out: { status: number; json: any } = { status: 200, json: undefined };
  const res: any = {
    setHeader: () => {},
    status(code: number) { out.status = code; return res; },
    json(payload: unknown) { out.json = payload; return res; },
  };
  return handler({ method, body, headers: { "x-forwarded-for": ip } }, res).then(() => out);
}

const valid = { name: "Sam", email: "sam@example.com", message: "Hi, I'd love to work together." };

describe("POST /api/contact", () => {
  beforeEach(() => {
    sendMail.mockClear();
    process.env.GMAIL_USER = "me@gmail.com";
    process.env.GMAIL_APP_PASSWORD = "abcdabcdabcdabcd";
    delete process.env.CONTACT_TO_EMAIL;
  });

  it("sends a valid enquiry with the visitor as reply-to", async () => {
    const r = await call(valid, { ip: "2.2.2.2" });
    expect(r).toEqual({ status: 200, json: { ok: true } });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: "me@gmail.com",
      replyTo: { name: "Sam", address: "sam@example.com" },
    }));
  });

  it("accepts a JSON string body", async () => {
    expect((await call(JSON.stringify(valid), { ip: "3.3.3.3" })).status).toBe(200);
  });

  it("rejects non-POST requests", async () => {
    expect((await call(undefined, { method: "GET", ip: "4.4.4.4" })).status).toBe(405);
  });

  it("rejects invalid input with a friendly message", async () => {
    const bad = await call({ ...valid, email: "nope" }, { ip: "5.5.5.5" });
    expect(bad.status).toBe(400);
    expect(bad.json.error).toMatch(/email/i);
    expect((await call({ ...valid, message: "hi" }, { ip: "5.5.5.5" })).status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("silently drops honeypot submissions", async () => {
    expect((await call({ ...valid, website: "http://spam" }, { ip: "6.6.6.6" })).status).toBe(200);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("reports an error when Gmail isn't configured or fails", async () => {
    sendMail.mockRejectedValueOnce(new Error("auth"));
    expect((await call(valid, { ip: "7.7.7.7" })).status).toBe(500);
    delete process.env.GMAIL_APP_PASSWORD;
    expect((await call(valid, { ip: "7.7.7.8" })).status).toBe(500);
  });

  it("rate limits repeated submissions from one IP", async () => {
    for (let i = 0; i < 5; i++) await call(valid, { ip: "8.8.8.8" });
    expect((await call(valid, { ip: "8.8.8.8" })).status).toBe(429);
  });
});
