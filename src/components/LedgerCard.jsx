import { useEffect, useRef, useState } from "react";

export default function LedgerCard({ balance, referralCount, usdtRate, coinName = "Nova Coin" }) {
  const [bump, setBump] = useState(false);
  const prevBalance = useRef(balance);

  useEffect(() => {
    if (prevBalance.current !== balance) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 250);
      prevBalance.current = balance;
      return () => clearTimeout(t);
    }
  }, [balance]);

  const usdtValue = (balance * usdtRate).toFixed(2);

  return (
    <div className="ledger-card">
      <div className="seal" aria-hidden="true">N</div>
      <div className="label">{coinName} balance</div>
      <div className={`amount${bump ? " bump" : ""}`}>{balance.toLocaleString()}</div>
      <div className="subrow">
        <div className="item">
          ≈ <b>{usdtValue} USDT</b>
        </div>
        <div className="item">
          Referrals <b>{referralCount}</b>
        </div>
      </div>
    </div>
  );
}
