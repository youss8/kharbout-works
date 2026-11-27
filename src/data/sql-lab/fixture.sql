PRAGMA foreign_keys = ON;

CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE awards (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    amount INTEGER NOT NULL CHECK (amount > 0)
);

CREATE TABLE project_tags (
    project_id INTEGER NOT NULL REFERENCES projects(id),
    tag TEXT NOT NULL,
    PRIMARY KEY (project_id, tag)
);

INSERT INTO projects VALUES
    (1, 'Field Training'),
    (2, 'Water Access'),
    (3, 'Health Outreach');

INSERT INTO awards VALUES (101, 1, 800), (102, 1, 200), (103, 2, 500), (104, 3, 300);
INSERT INTO project_tags VALUES
    (1, 'priority'),
    (1, 'training'),
    (2, 'priority'),
    (3, 'outreach');
