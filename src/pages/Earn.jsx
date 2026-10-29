import AdsSection from "../components/AdsSection";
import Tasks from "./Tasks";
import SuperTasks from "./SuperTasks";

export default function Earn({ settings, onBalanceChange }) {
  return (
    <div>
      {/* Ad platforms come from Admin > Ads. No platform is hard-coded here. */}
      <AdsSection coinName={settings.coin_name || "coins"} onBalanceChange={onBalanceChange} />
      <Tasks onBalanceChange={onBalanceChange} />
      <div className="section">
        <SuperTasks />
      </div>
    </div>
  );
}