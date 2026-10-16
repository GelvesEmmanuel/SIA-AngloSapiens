CREATE TABLE "docentes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(50) NOT NULL,
	"apellido" varchar(50) NOT NULL,
	"correo" varchar(50) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "docentes_correo_unique" UNIQUE("correo")
);
