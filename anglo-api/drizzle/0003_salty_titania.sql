CREATE TABLE "aulas" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "aulas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "grupos" RENAME COLUMN "aula" TO "aula_id";--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_aula_id_aulas_id_fk" FOREIGN KEY ("aula_id") REFERENCES "public"."aulas"("id") ON DELETE set null ON UPDATE no action;