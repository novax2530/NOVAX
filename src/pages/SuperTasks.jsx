import { useEffect, useRef, useState } from "react";
import { callApi } from "../lib/api";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function SuperTaskRow({ task, onSubmitted }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const imageBase64 = await fileToBase64(file);
      await callApi("submit_task_proof", { taskId: task.id, image: imageBase64 });
      onSubmitted(task.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const status = task.submission_status;

  return (
    <div className="task">
      <div className="info">
        <p className="title">{task.title}</p>
        {task.description && <p className="desc">{task.description}</p>}
        {task.link && (
          <p className="desc">
            <a href={task.link} target="_blank" rel="noreferrer" style={{ color: "var(--primary-bright)" }}>
              Open task link
            </a>
          </p>
        )}
        <p className="reward">+{task.reward} coins · proof required</p>
        {error && <p className="error-text">{error}</p>}
      </div>
      {status === "pending" && (
        <button className="btn btn-ghost" disabled>
          Pending review
        </button>
      )}
      {status === "approved" && (
        <button className="btn btn-done" disabled>
          Approved
        </button>
      )}
      {(!status || status === "rejected") && (
        <>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFile} />
          <button className="btn btn-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "…" : status === "rejected" ? "Retry" : "Upload proof"}
          </button>
        </>
      )}
    </div>
  );
}

export default function SuperTasks() {
  const [tasks, setTasks] = useState(null);

  async function load() {
    const { tasks } = await callApi("super_tasks");
    setTasks(tasks);
  }
  useEffect(() => {
    load();
  }, []);

  function markPending(taskId) {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, submission_status: "pending" } : t)));
  }

  if (tasks === null) return null;
  if (tasks.length === 0) return null;

  return (
    <>
      <div className="section-title" style={{ marginTop: 20 }}>
        Super tasks
      </div>
      {tasks.map((t) => (
        <SuperTaskRow key={t.id} task={t} onSubmitted={markPending} />
      ))}
    </>
  );
}
