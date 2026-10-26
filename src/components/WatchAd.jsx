import { useEffect, useRef, useState } from "react";

export default function WatchAd({ blockId, rewardCoins, coinName, label = "Watch an ad" }) {
  const controllerRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | playing | pending | error

  useEffect(() => {
    if (blockId && window.Adsgram) {
      controllerRef.current = window.Adsgram.init({ blockId });
    }
  }, [blockId]);

  if (!blockId) return null;

  function watch() {
    if (!controllerRef.current) return;
    setStatus("playing");
    controllerRef.current
      .show()
      .then(() => {
        setStatus("pending");
        setTimeout(() => setStatus("idle"), 4000);
      })
      .catch(() => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      });
  }

  return (
    <div className="task">
      <div className="info">
        <p className="title">{label}</p>
        <p className="reward">
          {status === "pending"
            ? `Confirming your view — ${rewardCoins} ${coinName} on the way`
            : status === "error"
            ? "No ad available right now"
            : `+${rewardCoins} ${coinName} per view`}
        </p>
      </div>
      <button className="btn btn-primary" onClick={watch} disabled={status === "playing" || status === "pending"}>
        {status === "playing" ? "…" : "Watch"}
      </button>
    </div>
  );
}
