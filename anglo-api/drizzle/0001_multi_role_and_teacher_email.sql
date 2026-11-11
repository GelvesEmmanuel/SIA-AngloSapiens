CREATE TABLE "usuario_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"rol" "rol_usuario" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_usuario_rol" UNIQUE("usuario_id", "rol")
);
--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_usuario_id_usuarios_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("usuario_id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_usuario_roles_usuario" ON "usuario_roles" USING btree ("usuario_id");
--> statement-breakpoint
ALTER TABLE "docentes" ADD COLUMN "correo" varchar(255);
--> statement-breakpoint
ALTER TABLE "docentes" ADD COLUMN "fecha_vinculacion" text;
--> statement-breakpoint
INSERT INTO "usuario_roles" ("usuario_id", "rol")
SELECT "usuario_id", "rol"
FROM "usuarios"
ON CONFLICT ("usuario_id", "rol") DO NOTHING;
--> statement-breakpoint
DO $$
BEGIN
	IF (SELECT count(*) FROM "usuarios") <> (SELECT count(*) FROM "usuario_roles") THEN
		RAISE EXCEPTION 'Role backfill mismatch: every user must retain its previous role';
	END IF;
END
$$;
--> statement-breakpoint
ALTER TABLE "usuarios" DROP COLUMN "rol";
