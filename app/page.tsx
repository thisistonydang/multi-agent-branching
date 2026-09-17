import { desc } from "drizzle-orm";
import { createTask, deleteTask, updateTaskStatus } from "./actions";
import { db } from "@/lib/db";
import { tasks, type TaskStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

async function getTasks() {
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export default async function Home() {
  const tasks = await getTasks();
  const completedCount = tasks.filter((task) => task.status === "done").length;

  return (
    <main>
      <header className="hero">
        <div>
          <p className="eyebrow">Parallel development demo</p>
          <h1>Agent Task Board</h1>
          <p className="lede">
            Track small features while each agent works in its own Git worktree and Neon branch.
          </p>
        </div>
        <div className="summary" aria-label="Task summary">
          <strong>{tasks.length}</strong>
          <span>Total tasks</span>
          <strong>{completedCount}</strong>
          <span>Completed</span>
        </div>
      </header>

      <section className="panel" aria-labelledby="new-task-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Create</p>
            <h2 id="new-task-heading">New task</h2>
          </div>
        </div>

        <form action={createTask} className="task-form">
          <label>
            Title
            <input name="title" maxLength={120} placeholder="Add task filtering" required />
          </label>
          <label>
            Agent
            <input name="agent_name" maxLength={80} placeholder="Agent name (optional)" />
          </label>
          <label className="full-width">
            Description
            <textarea name="description" maxLength={1000} rows={3} placeholder="What should this task deliver?" />
          </label>
          <button className="primary" type="submit">Create task</button>
        </form>
      </section>

      <section className="tasks-section" aria-labelledby="tasks-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Database-backed</p>
            <h2 id="tasks-heading">Tasks</h2>
          </div>
          <span className="task-count">{tasks.length} {tasks.length === 1 ? "task" : "tasks"}</span>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Create the first task to test the app and its Neon database.</p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <article className="task-card" key={task.id}>
                <div className="task-card-topline">
                  <span className={`status status-${task.status}`}>{statusLabels[task.status]}</span>
                  <span className="task-id">#{task.id}</span>
                </div>
                <h3>{task.title}</h3>
                {task.description && <p className="description">{task.description}</p>}
                <p className="agent">{task.agentName ? `Assigned to ${task.agentName}` : "Unassigned"}</p>

                <div className="task-actions">
                  <form action={updateTaskStatus}>
                    <input type="hidden" name="id" value={task.id} />
                    <label className="sr-only" htmlFor={`status-${task.id}`}>Status</label>
                    <select id={`status-${task.id}`} name="status" defaultValue={task.status}>
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button type="submit">Update</button>
                  </form>
                  <form action={deleteTask}>
                    <input type="hidden" name="id" value={task.id} />
                    <button className="danger" type="submit">Delete</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
