// One "watch an ad" row for ONE admin-configured ad platform.
// Flow: ad_start (server opens a session) -> show the ad -> ad_complete (server pays the reward).
// Reward amount, daily cap and minimum watch time are enforced on the server, never here.
import { useState } from "react";
import { callApi } from "../lib/api";
import { showAd } from "../lib/adSdk";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function AdPlatformCard({ platform, coinName, onBalanceChange, onRewarded }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  
  const limit = platform.dailyLimit;
  const left = limit > 0 ? Math.max(limit - platform.viewsToday, 0) : null;
  const capped = left === 0;
  
  async function watch() {
    setBusy(true);
    setMsg("");
    setIsError(false);
    try {
      const { sessionId, minSeconds } = await callApi("ad_start", { platformId: platform.id });
      const t0 = Date.now();
      await showAd(platform);
      const wait = minSeconds * 1000 - (Date.now() - t0) + 300;
      if (wait > 0) await sleep(wait);
      const { reward, newBalance } = await callApi("ad_complete", { sessionId });
      onBalanceChange?.(newBalance);
      onRewarded?.(platform.id);
      setMsg(`+${reward} ${coinName} earned`);
    } catch (e) {
      setIsError(true);
      setMsg(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }
  
  return (
    <div className="task">
      <div className="info">
        <p className="title">{platform.label}</p>
        <p className="reward">
          {msg ? (
            <span style={isError ? { color: "var(--danger, #ff6b6b)" } : undefined}>{msg}</span>
          ) : capped ? (
            "Daily limit reached — come back tomorrow"
          ) : (
            `+${platform.reward} ${coinName} per view${left !== null ? ` · ${left} left today` : ""}`
          )}
        </p>
      </div>
      <button className="btn btn-primary" onClick={watch} disabled={busy || capped}>
        {busy ? "…" : "Watch"}
      </button>
    </div>
  );
}