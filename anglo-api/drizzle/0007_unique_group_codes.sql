WITH duplicados AS (
  SELECT
    id,
    codigo,
    created_at,
    row_number() OVER (PARTITION BY codigo ORDER BY created_at, id) AS ocurrencia
  FROM "grupos"
),
reasignaciones AS (
  SELECT
    id,
    row_number() OVER (ORDER BY codigo, created_at, id) AS consecutivo
  FROM duplicados
  WHERE ocurrencia > 1
),
maximo AS (
  SELECT COALESCE(MAX((substring(codigo FROM '^GRU-([0-9]+)$'))::bigint), 0) AS numero
  FROM "grupos"
)
UPDATE "grupos" AS grupo
SET codigo = 'GRU-' || CASE
  WHEN maximo.numero + reasignaciones.consecutivo < 100000
    THEN lpad((maximo.numero + reasignaciones.consecutivo)::text, 5, '0')
  ELSE (maximo.numero + reasignaciones.consecutivo)::text
END
FROM reasignaciones, maximo
WHERE grupo.id = reasignaciones.id;--> statement-breakpoint
ALTER TABLE "grupos" DROP CONSTRAINT "uk_grupo_periodo";--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "uk_grupo_codigo" UNIQUE("codigo");