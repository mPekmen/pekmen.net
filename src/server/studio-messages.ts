export interface StudioDatabase {
  prepare(sql: string): {
    bind(...values: (string | number | null)[]): ReturnType<StudioDatabase["prepare"]>;
    run(): Promise<{ success: boolean }>;
    first<T>(): Promise<T | null>;
    all<T>(): Promise<{ results: T[] }>;
  };
}

type MessageInput = { name: string; email: string; body: string };
type StudioMessage = MessageInput & { id: string; created_at: number; read_at: number | null };
const pageSize = 25;

export async function saveMessage(db: StudioDatabase, message: MessageInput): Promise<void> {
  const result = await db.prepare(
    "INSERT INTO studio_messages (id, name, email, body, created_at) VALUES (?, ?, ?, ?, ?)",
  ).bind(crypto.randomUUID(), message.name, message.email, message.body, Date.now()).run();
  if (!result.success) throw new Error("Inbox write failed");
}

export async function inboxSummary(db: StudioDatabase | undefined): Promise<number | null> {
  if (!db) return null;
  try {
    const row = await db.prepare(
      "SELECT COUNT(*) AS total FROM studio_messages WHERE archived_at IS NULL AND read_at IS NULL",
    ).first<{ total: number }>();
    return row?.total ?? null;
  } catch {
    return null;
  }
}

export async function listMessages(db: StudioDatabase, archived: boolean, page: number) {
  const where = archived ? "archived_at IS NOT NULL" : "archived_at IS NULL";
  const { results } = await db.prepare(
    `SELECT id, name, email, body, created_at, read_at FROM studio_messages WHERE ${where}
     ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
  ).bind(pageSize + 1, (page - 1) * pageSize).all<StudioMessage>();
  return { messages: results.slice(0, pageSize), hasNext: results.length > pageSize };
}

const updates = {
  read: "read_at = COALESCE(read_at, ?)",
  unread: "read_at = NULL",
  archive: "archived_at = COALESCE(archived_at, ?)",
  restore: "archived_at = NULL",
};
type MessageAction = keyof typeof updates;
export function isMessageAction(value: unknown): value is MessageAction {
  return typeof value === "string" && Object.hasOwn(updates, value);
}

export async function updateMessage(db: StudioDatabase, id: string, action: MessageAction) {
  const statement = db.prepare(`UPDATE studio_messages SET ${updates[action]} WHERE id = ? RETURNING id`);
  return (action === "read" || action === "archive"
    ? await statement.bind(Date.now(), id).first<{ id: string }>()
    : await statement.bind(id).first<{ id: string }>()) !== null;
}
