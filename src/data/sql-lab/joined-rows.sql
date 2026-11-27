SELECT p.name AS project, a.id AS award, a.amount, t.tag,
       COUNT(*) OVER (PARTITION BY a.id) AS copies
FROM projects AS p
JOIN awards AS a ON a.project_id = p.id
JOIN project_tags AS t ON t.project_id = p.id
WHERE t.tag IN ('priority', 'training')
ORDER BY p.name, a.id, t.tag;
