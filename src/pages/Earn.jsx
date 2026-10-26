import WatchAd from "../components/WatchAd";
import TaskAd from "../components/TaskAd";
import Tasks from "./Tasks";
import SuperTasks from "./SuperTasks";

export default function Earn({ settings, onBalanceChange }) {
  return (
    <div>
      {settings.adsgram_block_id && (
        <div className="section">
          <div className="section-title">Watch &amp; earn</div>
          <WatchAd
            blockId={settings.adsgram_block_id}
            rewardCoins={settings.ad_reward_coins ?? 10}
            coinName={settings.coin_name || "coins"}
            label="Watch an ad"
          />
          {settings.adsgram_task_block_id && <TaskAd blockId={settings.adsgram_task_block_id} />}
        </div>
      )}
      <Tasks onBalanceChange={onBalanceChange} />
      <div className="section">
        <SuperTasks />
      </div>
    </div>
  );
}
