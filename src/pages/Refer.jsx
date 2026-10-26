import { getTelegram } from "../lib/telegram";

export default function Refer({ profile, referralCount, referralReward, botUsername }) {
  const link = `https://t.me/${botUsername}/app?startapp=${profile.ref_code}`;

  function share() {
    const tg = getTelegram();
    const text = `Join me and start earning — use my link to get started.`;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    } else {
      navigator.clipboard.writeText(link);
    }
  }

  return (
    <div className="section">
      <div className="section-title">Invite friends</div>
      <div className="refer-code-box">
        <div className="hint">Your referral code</div>
        <div className="code">{profile.ref_code}</div>
        <button className="btn btn-primary" onClick={share} style={{ width: "100%" }}>
          Share invite link
        </button>
        <p className="hint" style={{ marginTop: 10, wordBreak: "break-all" }}>{link}</p>
      </div>

      <div className="stat-grid">
        <div className="stat-box">
          <div className="num">{referralCount}</div>
          <div className="label">Friends joined</div>
        </div>
        <div className="stat-box">
          <div className="num">+{referralReward}</div>
          <div className="label">Coins per invite</div>
        </div>
      </div>
    </div>
  );
}
