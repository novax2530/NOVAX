const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME;

export default function Landing() {
  return (
    <div className="app" style={{ paddingBottom: 40 }}>
      <div className="topbar">
        <div className="wordmark">
          <span className="logo-slot" aria-hidden="true">N</span>
          Nova <span>X</span>
        </div>
      </div>

      <div className="section">
        <div className="ledger-card" style={{ marginTop: 0 }}>
          <div className="label">What is this?</div>
          <p style={{ color: "var(--text)", fontSize: 15, lineHeight: 1.6, marginTop: 10 }}>
            Nova X is a rewards app for our Telegram community, with Nova X Minibot, your built-in AI chat. Complete simple tasks, invite
            friends, keep your daily streak going, and earn Nova Coin redeemable for USDT.
          </p>
        </div>
      </div>

      <div className="section">
        <div className="section-title">How it works</div>
        <div className="task">
          <div className="info">
            <p className="title">Complete tasks</p>
            <p className="desc">Join channels, watch short ads, or finish sponsored tasks for coins.</p>
          </div>
        </div>
        <div className="task">
          <div className="info">
            <p className="title">Invite friends</p>
            <p className="desc">Earn coins for every friend who joins through your link.</p>
          </div>
        </div>
        <div className="task">
          <div className="info">
            <p className="title">Daily streak</p>
            <p className="desc">Check in every day for a growing coin bonus.</p>
          </div>
        </div>
        <div className="task">
          <div className="info">
            <p className="title">Withdraw</p>
            <p className="desc">Cash out your balance for USDT once you hit the minimum.</p>
          </div>
        </div>
      </div>

      <div className="section">
        <a
          href={BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : "#"}
          className="btn btn-primary"
          style={{ display: "block", textAlign: "center", textDecoration: "none", padding: "14px" }}
        >
          Open in Telegram
        </a>
      </div>
    </div>
  );
}
