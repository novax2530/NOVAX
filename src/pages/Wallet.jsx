import { useEffect, useState } from "react";
import { callApi } from "../lib/api";

export default function Wallet({ profile, settings, onBalanceChange }) {
  const [amount, setAmount] = useState("");
  const [wallet, setWallet] = useState("");
  const [withdrawals, setWithdrawals] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const coinName = settings.coin_name || "coins";
  const rate = Number(settings.coin_to_usdt_rate ?? 0.00001);
  const minWithdrawal = Number(settings.min_withdrawal_coins ?? (rate > 0 ? Math.ceil(1 / rate) : 0));
  const windowStart = settings.withdrawal_window_start_hour ?? 8;
  const windowEnd = settings.withdrawal_window_end_hour ?? 20;

  async function loadWithdrawals() {
    const { withdrawals } = await callApi("my_withdrawals");
    setWithdrawals(withdrawals);
  }

  useEffect(() => {
    loadWithdrawals();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    const amt = Number(amount);
    if (!amt || amt < minWithdrawal) {
      setError(`Minimum withdrawal is ${minWithdrawal} ${coinName}`);
      return;
    }
    setBusy(true);
    try {
      await callApi("request_withdrawal", { amount: amt, wallet });
      onBalanceChange(profile.balance - amt);
      setAmount("");
      setWallet("");
      loadWithdrawals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section">
      <div className="section-title">Request withdrawal</div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Withdrawals are only accepted between {windowStart}:00 and {windowEnd}:00 (UTC{settings.withdrawal_timezone_offset_hours ? `${settings.withdrawal_timezone_offset_hours > 0 ? "+" : ""}${settings.withdrawal_timezone_offset_hours}` : ""}). Minimum is {minWithdrawal.toLocaleString()} {coinName} (≈1 USDT).
      </p>

      <form onSubmit={submit}>
        <div className="field">
          <label>Amount ({coinName})</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`min ${minWithdrawal}`}
          />
          {amount && <p className="hint">≈ {(Number(amount) * rate).toFixed(2)} USDT</p>}
        </div>
        <div className="field">
          <label>USDT wallet address</label>
          <input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="TRC20 address" />
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} disabled={busy}>
          {busy ? "Submitting…" : "Request withdrawal"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </form>

      <div className="section-title" style={{ marginTop: 24 }}>
        History
      </div>
      {withdrawals === null && <p className="hint">Loading…</p>}
      {withdrawals?.length === 0 && <p className="empty-state">No withdrawal requests yet.</p>}
      {withdrawals?.map((w) => (
        <div className="wd-row" key={w.id}>
          <div>
            <div className="wd-amount">{w.amount} {coinName}</div>
            <div className="hint">{new Date(w.requested_at).toLocaleDateString()}</div>
          </div>
          <span className={`wd-status ${w.status}`}>{w.status}</span>
        </div>
      ))}
    </div>
  );
}
