import { useEffect, useState } from "react";
import { callApi } from "../lib/api";

export default function Streak({ coinName, onBalanceChange }) {
  const [status, setStatus] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const data = await callApi("streak_status");
    setStatus(data);
  }
  useEffect(() => {
    load();
  }, []);

  async function claim() {
    setClaiming(true);
    setError("");
    try {
      const result = await callApi("claim_streak");
      onBalanceChange(result.newBalance);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setClaiming(false);
    }
  }

  if (!status) return <div className="empty-state">Loading…</div>;

  const rewards = status.rewards || [20, 25, 30, 40, 50, 70, 100];
  const activeDay = status.claimedToday ? status.currentStreak : status.currentStreak + 1;

  return (
    <div className="section">
      <div className="section-title">Daily streak</div>
      <div className="streak-card">
        <div className="streak-header">
          <div className="flame">🔥</div>
          <div>
            <div className="streak-day-label">Day {Math.min(activeDay, rewards.length)} of {rewards.length}</div>
            <div className="hint">Come back every day to keep it going</div>
          </div>
        </div>

        <div className="streak-track">
          {rewards.map((reward, i) => {
            const day = i + 1;
            const done = day <= status.currentStreak;
            const isNext = day === activeDay && !status.claimedToday;
            return (
              <div key={day} className={`streak-node${done ? " done" : ""}${isNext ? " next" : ""}`}>
                <div className="streak-node-day">{done ? "✓" : day}</div>
                <div className="streak-node-reward">{reward}</div>
              </div>
            );
          })}
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }} onClick={claim} disabled={claiming || status.claimedToday}>
          {status.claimedToday ? "Claimed for today" : claiming ? "Claiming…" : `Claim +${rewards[Math.min(activeDay, rewards.length) - 1]} ${coinName}`}
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
