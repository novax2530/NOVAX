import { useEffect, useState } from "react";
import { initTelegram, getInitData, getStartParam } from "./lib/telegram";
import { callApi, setToken, setReauthHandler } from "./lib/api";
import LedgerCard from "./components/LedgerCard";
import TabBar from "./components/TabBar";
import JoinGate from "./components/JoinGate";
import Landing from "./components/Landing";
import Splash from "./components/Splash";
import Streak from "./pages/Streak";
import Earn from "./pages/Earn";
import Refer from "./pages/Refer";
import Wallet from "./pages/Wallet";
import Admin from "./pages/Admin";
import Chat from "./pages/Chat";

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME;
const SPLASH_MIN_MS = 1000; // splash stays at least this long so it never just flashes
const PRELOAD_MAX_MS = 4000; // never wait longer than this for the preload

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
}

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });
}

export default function App() {
  const [status, setStatus] = useState("loading"); // loading | gated | ready | error | outside-telegram
  const [profile, setProfile] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [settings, setSettings] = useState({});
  const [gateChannels, setGateChannels] = useState([]);
  const [tab, setTab] = useState("tasks");
  const [error, setError] = useState("");
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [chatHistory, setChatHistory] = useState(null); // preloaded Minibot messages
  
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);
  
  async function authenticate() {
    const { token } = await callApi("auth", { initData: getInitData(), startParam: getStartParam() });
    setToken(token);
  }
  
  async function bootstrap() {
    setStatus("loading");
    try {
      initTelegram();
      if (!getInitData()) {
        setStatus("outside-telegram");
        return;
      }
      
      await authenticate();
      setReauthHandler(authenticate);
      
      // Start preloading the Minibot history and the header logo right away,
      // in parallel with the other startup calls. Failures are ignored.
      const chatPreload = callApi("chat_history", { limit: 50 })
        .then((d) => setChatHistory(d.messages || []))
        .catch(() => {});
      const logoPreload = preloadImage("/logo.png");
      
      const me = await callApi("me");
      setProfile(me.profile);
      setSettings(me.settings || {});
      callApi("referral_info")
        .then((r) => setReferralCount(r.referralCount ?? 0))
        .catch(() => {});
      
      if (!me.profile.is_admin) {
        const gate = await callApi("gate_status");
        if (!gate.passed) {
          setGateChannels(gate.channels);
          setStatus("gated");
          return;
        }
      }
      
      // Keep the splash up until the chat and logo are ready (or the safety timeout hits).
      await withTimeout(Promise.all([chatPreload, logoPreload]), PRELOAD_MAX_MS);
      
      setStatus("ready");
    } catch (e) {
      setError(e.message);
      setStatus("error");
    }
  }
  
  useEffect(() => {
    bootstrap();
  }, []);
  
  async function recheckGate() {
    const gate = await callApi("gate_status");
    if (gate.passed) {
      setStatus("ready");
    } else {
      setGateChannels(gate.channels);
    }
  }
  
  function updateBalance(newBalance) {
    setProfile((p) => ({ ...p, balance: newBalance }));
  }
  
  const showSplash = status === "loading" || !minTimePassed;
  
  function renderBody() {
    if (status === "loading") return null; // the splash covers the screen
    if (status === "outside-telegram") return <Landing />;
    if (status === "error")
      return (
        <div className="center-screen">
          <p style={{ color: "var(--danger)", margin: 0 }}>{error}</p>
          <button className="btn btn-primary" onClick={bootstrap}>
            Try again
          </button>
        </div>
      );
    if (status === "gated") return <JoinGate channels={gateChannels} onRecheck={recheckGate} />;
    
    const coinName = settings.coin_name || "Nova Coin";
    
    return (
      <div className="app">
        <div className="topbar">
          <div className="wordmark">
            <img className="logo-img" src="/logo.png" alt="" aria-hidden="true" />
            Nova <span>X</span>
          </div>
          <div className="greeting">{profile.first_name}</div>
        </div>

        {tab !== "minibot" && (
          <LedgerCard
            balance={Number(profile.balance)}
            referralCount={referralCount}
            usdtRate={Number(settings.coin_to_usdt_rate ?? 0.001)}
            coinName={coinName}
          />
        )}

        {tab === "tasks" && <Streak coinName={coinName} onBalanceChange={updateBalance} />}
        {tab === "earn" && <Earn settings={settings} onBalanceChange={updateBalance} />}
        {tab === "minibot" && <Chat initialMessages={chatHistory} onMessagesChange={setChatHistory} />}
        {tab === "frens" && (
          <Refer
            profile={profile}
            referralCount={referralCount}
            referralReward={settings.referral_reward ?? 200}
            botUsername={BOT_USERNAME}
          />
        )}
        {tab === "wallet" && <Wallet profile={profile} settings={settings} onBalanceChange={updateBalance} />}
        {tab === "admin" && profile.is_admin && (
          <Admin settings={settings} onSettingsChange={setSettings} />
        )}

        <TabBar active={tab} onChange={setTab} isAdmin={profile.is_admin} />
      </div>
    );
  }
  
  return (
    <>
      <Splash visible={showSplash} />
      {renderBody()}
    </>
  );
}