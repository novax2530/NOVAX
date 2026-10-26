import { useState } from "react";

export default function JoinGate({ channels, onRecheck }) {
  const [checking, setChecking] = useState(false);

  async function recheck() {
    setChecking(true);
    await onRecheck();
    setChecking(false);
  }

  return (
    <div className="center-screen">
      <div style={{ fontFamily: "var(--display)", fontSize: 18, color: "var(--text)" }}>
        Join to continue
      </div>
      <p>You need to join the channels below before you can use the app.</p>

      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
        {channels.map((c) => (
          <div key={c.chat} className="task">
            <div className="info">
              <p className="title">{c.label || c.chat}</p>
              <p className="reward" style={{ color: c.joined ? "var(--success)" : "var(--gold)" }}>
                {c.joined ? "Joined" : "Not joined yet"}
              </p>
            </div>
            {!c.joined && (
              <button className="btn btn-primary" onClick={() => window.open(c.url, "_blank")}>
                Join
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-ghost" style={{ width: "100%", marginTop: 8 }} onClick={recheck} disabled={checking}>
        {checking ? "Checking…" : "I've joined — recheck"}
      </button>
    </div>
  );
}
