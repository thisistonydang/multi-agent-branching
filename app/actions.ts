"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tasks, type TaskStatus } from "@/lib/schema";

const validStatuses = new Set<TaskStatus>(["todo", "in_progress", "done"]);

function requiredString(formData: FormData, key: string, maxLength: number) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} is required.`);
  }

  return value.trim().slice(0, maxLength);
}

function taskId(formData: FormData) {
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("A valid task ID is required.");
  }

  return id;
}

export async function createTask(formData: FormData) {
  const title = requiredString(formData, "title", 120);
  const descriptionValue = formData.get("description");
  const agentValue = formData.get("agent_name");
  const description = typeof descriptionValue === "string" ? descriptionValue.trim().slice(0, 1000) : "";
  const agentName = typeof agentValue === "string" ? agentValue.trim().slice(0, 80) : "";
  await db.insert(tasks).values({
    title,
    description,
    agentName,
  });

  revalidatePath("/");
}

export async function updateTaskStatus(formData: FormData) {
  const id = taskId(formData);
  const status = formData.get("status");

  if (typeof status !== "string" || !validStatuses.has(status as TaskStatus)) {
    throw new Error("A valid task status is required.");
  }

  await db
    .update(tasks)
    .set({ status: status as TaskStatus, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, id));

  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  const id = taskId(formData);

  await db.delete(tasks).where(eq(tasks.id, id));
  revalidatePath("/");
}
