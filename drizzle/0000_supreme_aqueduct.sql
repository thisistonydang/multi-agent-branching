CREATE TABLE "tasks" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tasks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"agent_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_title_length" CHECK (char_length("tasks"."title") BETWEEN 1 AND 120),
	CONSTRAINT "tasks_description_length" CHECK (char_length("tasks"."description") <= 1000),
	CONSTRAINT "tasks_status_values" CHECK ("tasks"."status" IN ('todo', 'in_progress', 'done')),
	CONSTRAINT "tasks_agent_name_length" CHECK (char_length("tasks"."agent_name") <= 80)
);
