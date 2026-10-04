-- Storefront additions confirmed for the physical shop presentation.
INSERT INTO brands (name, status, created_at, updated_at)
SELECT b.name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Zeel'),
    ('Duckback')
) AS b(name)
WHERE NOT EXISTS (
    SELECT 1 FROM brands existing WHERE LOWER(existing.name) = LOWER(b.name)
);

INSERT INTO categories (name, status, created_at, updated_at)
SELECT c.name, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
    ('Belts'),
    ('Purses & Handbags')
) AS c(name)
WHERE NOT EXISTS (
    SELECT 1 FROM categories existing WHERE LOWER(existing.name) = LOWER(c.name)
);
