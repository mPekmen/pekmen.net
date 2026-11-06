import { contactRecipient, contactSender, isEmailConfigured } from "./config";
import { sendEmail } from "./email";
import { emailLayout } from "./email-template";
import type { StudioDatabase } from "./studio-messages";

type Reply = { id: string; message_id: string; body: string; state: "pending" | "accepted" | "failed" | "unknown"; created_at: number };
export const replyId = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;

export async function listReplies(db: StudioDatabase, ids: string[]) {
  if (!ids.length) return [];
  const { results } = await db.prepare(`SELECT * FROM studio_replies
    WHERE message_id IN (${ids.map(() => "?").join(",")}) ORDER BY created_at DESC LIMIT 150`)
    .bind(...ids).all<Reply>();
  return results;
}

export async function replyToMessage(db: StudioDatabase, messageId: string, id: string, body: string) {
  if (!isEmailConfigured()) return "not_configured";
  const message = await db.prepare("SELECT email FROM studio_messages WHERE id = ?").bind(messageId).first<{ email: string }>();
  if (!message) return "missing";
  if (!/^[^\s@<>(),;:\\"]+@[^\s@<>(),;:\\"]+\.[^\s@<>(),;:\\"]+$/.test(message.email)) return "invalid";
  const now = Date.now();
  const claim = await db.prepare(`INSERT INTO studio_replies (id, message_id, body, state, created_at)
    SELECT ?, ?, ?, 'pending', ?
    WHERE (SELECT COUNT(*) FROM studio_replies WHERE created_at >= ?) < 30
      AND (SELECT COUNT(*) FROM studio_replies WHERE message_id = ? AND created_at >= ?) < 5
    ON CONFLICT DO NOTHING RETURNING id`)
    .bind(id, messageId, body, now, now - 3_600_000, messageId, now - 3_600_000).first();
  if (!claim) return "limited";

  let state: Reply["state"];
  try {
    const accepted = await sendEmail({
      to: message.email, from: contactSender(), replyTo: contactRecipient(),
      subject: "Re: pekmen.net", text: body,
      html: emailLayout({ preheader: "Reply from pekmen.net", kicker: "Pekmen", title: "Reply from Pekmen", intro: "", quote: body }),
    }, { idempotencyKey: `studio-reply/${id}`, signal: AbortSignal.timeout(10_000) });
    state = accepted ? "accepted" : "failed";
  } catch (error) {
    state = error instanceof Error && /^resend_4(?!08)\d\d$/.test(error.message) ? "failed" : "unknown";
  }
  const result = await db.prepare("UPDATE studio_replies SET state = ? WHERE id = ?").bind(state, id).run();
  return result.success ? state : "unknown";
}
