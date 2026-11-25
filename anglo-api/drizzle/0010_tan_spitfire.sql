ALTER TABLE "matriculas" ADD COLUMN "nota_examen_final" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "matriculas" ADD COLUMN "nota_final" numeric(3, 1);--> statement-breakpoint
ALTER TABLE "notas" ADD COLUMN "curso_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "notas_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notas" ADD CONSTRAINT "fk_nota_habilidad_curso" FOREIGN KEY ("curso_id","habilidad") REFERENCES "public"."habilidades_curso"("curso_id","habilidad") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_notas_matricula" ON "notas" USING btree ("matricula_id");--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "chk_matricula_examen_final_rango" CHECK ("matriculas"."nota_examen_final" IS NULL OR ("matriculas"."nota_examen_final" >= 0.0 AND "matriculas"."nota_examen_final" <= 5.0));--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "chk_matricula_nota_final_rango" CHECK ("matriculas"."nota_final" IS NULL OR ("matriculas"."nota_final" >= 0.0 AND "matriculas"."nota_final" <= 5.0));