import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const taskStatuses = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof taskStatuses)[number];

export const tasks = pgTable(
  "tasks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<TaskStatus>().notNull().default("todo"),
    agentName: text("agent_name").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    check("tasks_title_length", sql`char_length(${table.title}) BETWEEN 1 AND 120`),
    check("tasks_description_length", sql`char_length(${table.description}) <= 1000`),
    check("tasks_status_values", sql`${table.status} IN ('todo', 'in_progress', 'done')`),
    check("tasks_agent_name_length", sql`char_length(${table.agentName}) <= 80`),
  ],
);

export type Task = typeof tasks.$inferSelect;
