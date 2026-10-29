// One "watch an ad" row for ONE admin-configured ad platform.
// Flow: ad_start (server opens a session) -> show the ad -> ad_complete (server pays the reward).
// Reward amount, daily cap and minimum watch time are enforced on the server, never here.
//
// The button shows "Watch" when there is no open ad session and "Claim" while a watched ad
// is still waiting to be claimed (e.g. the ad network has not confirmed the view yet).
// The open session is remembered in localStorage, so closing/reopening the app keeps "Claim".
import { useEffect, useRef, useState } from "react";
import { callApi } from "../lib/api";
import { showAd } from "../lib/adSdk";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SESSION_MAX_AGE_MS = 14 * 60 * 1000; // server expires sessions after 15 minutes
const AUTO_TRIES = 4; // automatic claim attempts right after the ad closes
const AUTO_GAP_MS = 2500;

const storeKey = (platformId) => `nova_ad_pending_${platformId}`;

function loadPending(platformId) {
  try {
    const raw = localStorage.getItem(storeKey(platformId));
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.sessionId !== "string" || typeof p.startedAt !== "number") return null;
    if (Date.now() - p.startedAt > SESSION_MAX_AGE_MS) {
      localStorage.removeItem(storeKey(platformId));
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

function savePending(platformId, p) {
  try {
    if (p) localStorage.setItem(storeKey(platformId), JSON.stringify(p));
    else localStorage.removeItem(storeKey(platformId));
  } catch {
    /* storage unavailable: the Claim state still works while the app stays open */
  }
}

// Errors that mean "try again in a moment" (keep the Claim button) vs. "this session is dead".
function isRetryable(e) {
  const m = String(e?.message || "").toLowerCase();
  if (e?.code === "NETWORK") return true;
  if (m.includes("not verified") || m.includes("not watched long enough")) return true;
  return false;
}

export default function AdPlatformCard({ platform, coinName, onBalanceChange, onRewarded }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [pending, setPending] = useState(() => loadPending(platform.id));
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // If the stored session goes stale while the app is open, fall back to "Watch".
  useEffect(() => {
    if (!pending) return;
    const left = SESSION_MAX_AGE_MS - (Date.now() - pending.startedAt);
    const t = setTimeout(() => {
      setPending(null);
      savePending(platform.id, null);
    }, Math.max(left, 0));
    return () => clearTimeout(t);
  }, [pending, platform.id]);

  const limit = platform.dailyLimit;
  const left = limit > 0 ? Math.max(limit - platform.viewsToday, 0) : null;
  const capped = left === 0 && !pending;

  function clearPending() {
    setPending(null);
    savePending(platform.id, null);
  }

  // One claim attempt. Returns true when the reward was paid or the session is finished for good.
  async function tryClaim(sessionId, { quiet = false } = {}) {
    try {
      const { reward, newBalance } = await callApi("ad_complete", { sessionId });
      clearPending();
      onBalanceChange?.(newBalance);
      onRewarded?.(platform.id);
      setIsError(false);
      setMsg(`+${reward} ${coinName} earned`);
      return true;
    } catch (e) {
      if (isRetryable(e)) {
        if (!quiet) {
          setIsError(false);
          setMsg("Still verifying your ad view… tap Claim again in a few seconds");
        }
        return false;
      }
      // Already rewarded, expired, not found, daily limit… nothing left to claim.
      clearPending();
      setIsError(true);
      setMsg(e.message || "Something went wrong");
      return true;
    }
  }

  async function watch() {
    setBusy(true);
    setMsg("");
    setIsError(false);
    let started = null;
    try {
      const { sessionId, minSeconds } = await callApi("ad_start", { platformId: platform.id });
      started = { sessionId, minSeconds, startedAt: Date.now() };
      // Remember the session right away: from here on the button is "Claim", never "Watch".
      setPending(started);
      savePending(platform.id, started);

      const t0 = Date.now();
      try {
        await showAd(platform);
      } catch (e) {
        // The ad never completed (no ad, closed early…): nothing to claim.
        clearPending();
        throw e;
      }
      const wait = minSeconds * 1000 - (Date.now() - t0) + 300;
      if (wait > 0) await sleep(wait);

      // Auto-claim, giving the ad network a few seconds to confirm the view.
      for (let i = 0; i < AUTO_TRIES; i++) {
        const finished = await tryClaim(sessionId, { quiet: i < AUTO_TRIES - 1 });
        if (finished) return;
        if (i < AUTO_TRIES - 1) await sleep(AUTO_GAP_MS);
      }
    } catch (e) {
      setIsError(true);
      setMsg(e.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    const p = pendingRef.current;
    if (!p) return;
    setBusy(true);
    setMsg("");
    setIsError(false);
    try {
      await tryClaim(p.sessionId);
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
          ) : pending ? (
            `Ad watched — tap Claim to get +${platform.reward} ${coinName}`
          ) : capped ? (
            "Daily limit reached — come back tomorrow"
          ) : (
            `+${platform.reward} ${coinName} per view${left !== null ? ` · ${left} left today` : ""}`
          )}
        </p>
      </div>
      <button
        className="btn btn-primary"
        onClick={pending ? claim : watch}
        disabled={busy || capped}
      >
        {busy ? "…" : pending ? "Claim" : "Watch"}
      </button>
    </div>
  );
}
