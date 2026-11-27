SELECT p.name AS project, SUM(a.amount) AS funding
FROM projects AS p
JOIN awards AS a ON a.project_id = p.id
JOIN project_tags AS t ON t.project_id = p.id
WHERE t.tag IN ('priority', 'training')
GROUP BY p.id, p.name
ORDER BY p.name;
