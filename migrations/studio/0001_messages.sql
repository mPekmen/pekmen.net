CREATE TABLE studio_messages (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  read_at INTEGER,
  archived_at INTEGER
);

CREATE INDEX studio_messages_inbox ON studio_messages(archived_at, created_at DESC, id DESC);
CREATE INDEX studio_messages_unread ON studio_messages(id)
  WHERE archived_at IS NULL AND read_at IS NULL;
