CREATE TABLE studio_content (
  kind TEXT NOT NULL CHECK (kind IN ('project', 'post', 'site')),
  slug TEXT NOT NULL,
  draft TEXT NOT NULL CHECK (json_valid(draft)),
  published TEXT CHECK (published IS NULL OR json_valid(published)),
  hidden INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),
  revision TEXT NOT NULL,
  PRIMARY KEY (kind, slug)
);

CREATE TABLE studio_media (
  id TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE studio_replies (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL REFERENCES studio_messages(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('pending', 'accepted', 'failed', 'unknown')),
  created_at INTEGER NOT NULL
);
CREATE INDEX studio_replies_message ON studio_replies(message_id, created_at DESC);
CREATE INDEX studio_replies_time ON studio_replies(created_at);
