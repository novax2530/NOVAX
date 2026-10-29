// "Watch & earn" block. Shows one row per ad platform the admin has ENABLED (Admin > Ads).
// If the admin disabled/removed every platform, nothing is rendered at all.
import { Fragment, useEffect, useState } from "react";
import { callApi } from "../lib/api";
import { ensureAdsgram } from "../lib/adSdk";
import AdPlatformCard from "./AdPlatformCard";
import TaskAd from "./TaskAd";

export default function AdsSection({ coinName, onBalanceChange }) {
  const [platforms, setPlatforms] = useState(null);
  
  useEffect(() => {
    callApi("ad_platforms")
      .then((d) => setPlatforms(d.platforms || []))
      .catch(() => setPlatforms([]));
  }, []);
  
  // Adsgram "sponsored task" blocks are a web component that needs the Adsgram script.
  const needsAdsgramTask = (platforms || []).some((p) => p.provider === "adsgram" && p.config?.task_block_id);
  useEffect(() => {
    if (needsAdsgramTask) ensureAdsgram().catch(() => {});
  }, [needsAdsgramTask]);
  
  if (!platforms || platforms.length === 0) return null;
  
  function rewarded(id) {
    setPlatforms((prev) => prev.map((p) => (p.id === id ? { ...p, viewsToday: p.viewsToday + 1 } : p)));
  }
  
  return (
    <div className="section">
      <div className="section-title">Watch &amp; earn</div>
      {platforms.map((p) => (
        <Fragment key={p.id}>
          <AdPlatformCard platform={p} coinName={coinName} onBalanceChange={onBalanceChange} onRewarded={rewarded} />
          {p.provider === "adsgram" && p.config?.task_block_id && <TaskAd blockId={p.config.task_block_id} />}
        </Fragment>
      ))}
    </div>
  );
}