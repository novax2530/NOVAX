// Centre button = Nova X Minibot. Icons are emoji/glyph placeholders until the
// user supplies real icon images (swap the .tab-icon / .bot-orb contents).
const LEFT = [
  { id: "tasks", label: "Tasks", icon: "🎯" },
  { id: "earn", label: "Earn", icon: "⚡" },
];
const RIGHT = [
  { id: "frens", label: "Frens", icon: "👥" },
  { id: "wallet", label: "Wallet", icon: "👛" },
];
const ADMIN = { id: "admin", label: "Admin", icon: "🛡️" };

export default function TabBar({ active, onChange, isAdmin }) {
  const right = isAdmin ? [...RIGHT, ADMIN] : RIGHT;

  const renderTab = (t) => (
    <button
      key={t.id}
      className={active === t.id ? "active" : ""}
      onClick={() => onChange(t.id)}
      aria-label={t.label}
      aria-current={active === t.id ? "page" : undefined}
    >
      <span className="tab-icon" aria-hidden="true">
        {t.icon}
      </span>
      {t.label}
    </button>
  );

  return (
    <nav className="tabbar">
      {LEFT.map(renderTab)}
      <button
        className={`minibot${active === "minibot" ? " active" : ""}`}
        onClick={() => onChange("minibot")}
        aria-label="Nova X Minibot chat"
        aria-current={active === "minibot" ? "page" : undefined}
      >
        <span className="bot-orb" aria-hidden="true">
          ✦
        </span>
        Minibot
      </button>
      {right.map(renderTab)}
    </nav>
  );
}
