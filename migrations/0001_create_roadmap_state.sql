CREATE TABLE IF NOT EXISTS roadmap_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    state TEXT NOT NULL
);
