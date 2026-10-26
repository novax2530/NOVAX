import { useEffect, useState } from "react";
import { callApi } from "../lib/api";

export default function Tasks({ onBalanceChange }) {
  const [tasks, setTasks] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { tasks } = await callApi("tasks");
      setTasks(tasks);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function complete(task) {
    setBusyId(task.id);
    setError("");
    try {
      const { newBalance } = await callApi("complete_task", { taskId: task.id });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: true } : t)));
      onBalanceChange(newBalance);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  if (tasks === null) return <div className="empty-state">Loading tasks…</div>;

  return (
    <div className="section">
      <div className="section-title">
        Available tasks <span className="count">{tasks.filter((t) => !t.done).length} open</span>
      </div>

      {tasks.length === 0 && <div className="empty-state">No tasks yet — check back soon.</div>}

      {tasks.map((t) => (
        <div className="task" key={t.id}>
          <div className="info">
            <p className="title">{t.title}</p>
            {t.description && <p className="desc">{t.description}</p>}
            <p className="reward">+{t.reward} coins</p>
          </div>
          {t.done ? (
            <button className="btn btn-done" disabled>
              Done
            </button>
          ) : (
            <button
              className="btn btn-primary"
              disabled={busyId === t.id}
              onClick={() => {
                if (t.link) window.open(t.link, "_blank");
                complete(t);
              }}
            >
              {busyId === t.id ? "…" : "Start"}
            </button>
          )}
        </div>
      ))}

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
