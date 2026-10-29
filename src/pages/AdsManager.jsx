// Admin > Ads. The admin adds, edits, switches on/off and removes ad platforms.
// Platforms are DATA (table ad_platforms) — nothing is hard-coded or mandatory.
import { useEffect, useState } from "react";
import { callApi } from "../lib/api";

// Field templates per platform type. "Custom" works with any network that gives you
// a script link plus a JavaScript function that shows a rewarded ad.
const PROVIDERS = {
  adsgram: {
    name: "Adsgram",
    help: "Get the Block ID from your Adsgram dashboard (Rewarded block). The sponsored-task block is optional.",
    fields: [
      { key: "block_id", label: "Block ID (rewarded ad)", placeholder: "int-12345", required: true },
      { key: "task_block_id", label: "Task block ID (optional — sponsored task)", placeholder: "task-12345" },
    ],
  },
  monetag: {
    name: "Monetag",
    help: "Copy the SDK script link and the Zone ID from your Monetag rewarded-interstitial zone.",
    fields: [
      { key: "script_url", label: "SDK script link (https://…)", placeholder: "https://…/sdk.js", required: true },
      { key: "zone_id", label: "Zone ID", placeholder: "1234567", required: true },
    ],
  },
  custom: {
    name: "Custom (any other network)",
    help: "For any other Telegram ad network: its SDK script link, plus the JavaScript function that shows the ad (it must return a promise that finishes when the ad was watched).",
    fields: [
      { key: "script_url", label: "SDK script link (https://…)", placeholder: "https://example.com/sdk.js", required: true },
      { key: "show_function", label: "Show function name", placeholder: "show_123  or  MySdk.showAd", required: true },
      {
        key: "script_attrs",
        label: "Script attributes (optional, JSON)",
        placeholder: '{"data-zone":"123"}',
        textarea: true,
      },
    ],
  },
};

const EMPTY = {
  provider: "adsgram",
  label: "",
  config: {},
  reward: "10",
  daily_limit: "20",
  min_seconds: "5",
  sort_order: "0",
};

export default function AdsManager({ coinName = "coins" }) {
  const [platforms, setPlatforms] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  
  async function load() {
    try {
      const { platforms } = await callApi("admin_list_ad_platforms");
      setPlatforms(platforms);
    } catch (e) {
      setError(e.message);
      setPlatforms([]);
    }
  }
  useEffect(() => {
    load();
  }, []);
  
  function openAdd() {
    setEditingId(null);
    setForm(EMPTY);
    setError("");
    setShowForm(true);
  }
  
  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      provider: p.provider,
      label: p.label,
      config: { ...(p.config || {}) },
      reward: String(p.reward),
      daily_limit: String(p.daily_limit),
      min_seconds: String(p.min_seconds),
      sort_order: String(p.sort_order),
    });
    setError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  
  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY);
    setError("");
  }
  
  function setCfg(key, value) {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  }
  
  async function save(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const payload = {
      label: form.label,
      config: form.config,
      reward: Number(form.reward),
      daily_limit: Number(form.daily_limit),
      min_seconds: Number(form.min_seconds),
      sort_order: Number(form.sort_order),
    };
    try {
      if (editingId) {
        await callApi("admin_update_ad_platform", { platformId: editingId, ...payload });
      } else {
        await callApi("admin_add_ad_platform", { provider: form.provider, ...payload });
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  
  async function toggle(p) {
    try {
      await callApi("admin_toggle_ad_platform", { platformId: p.id, active: !p.active });
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  
  async function remove(p) {
    try {
      await callApi("admin_remove_ad_platform", { platformId: p.id });
      setConfirmId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }
  
  const tpl = PROVIDERS[form.provider];
  
  return (
    <div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Add every ad network you want to use. Users see a "Watch &amp; earn" row for each platform that is
        switched on. Nothing is required: turn a platform off or remove it and it disappears from the app.
        Rewards, daily limits and minimum watch time are checked on the server.
      </p>

      {!showForm && (
        <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={openAdd}>
          + Add ad platform
        </button>
      )}

      {showForm && (
        <form onSubmit={save} style={{ marginBottom: 20 }}>
          <div className="section-title">{editingId ? "Edit ad platform" : "Add ad platform"}</div>

          <div className="field">
            <label>Platform type</label>
            <select
              value={form.provider}
              disabled={!!editingId}
              onChange={(e) => setForm({ ...form, provider: e.target.value, config: {} })}
            >
              {Object.entries(PROVIDERS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.name}
                </option>
              ))}
            </select>
            <p className="hint">{tpl.help}</p>
          </div>

          <div className="field">
            <label>Name shown to users</label>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Watch an ad"
              maxLength={80}
            />
          </div>

          {tpl.fields.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              {f.textarea ? (
                <textarea
                  value={form.config[f.key] || ""}
                  onChange={(e) => setCfg(f.key, e.target.value)}
                  placeholder={f.placeholder}
                />
              ) : (
                <input
                  value={form.config[f.key] || ""}
                  onChange={(e) => setCfg(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
              )}
            </div>
          ))}

          <div className="field">
            <label>Reward per view ({coinName})</label>
            <input type="number" min="0" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
          </div>
          <div className="field">
            <label>Max views per user per day (0 = unlimited)</label>
            <input type="number" min="0" max="1000" value={form.daily_limit} onChange={(e) => setForm({ ...form, daily_limit: e.target.value })} />
          </div>
          <div className="field">
            <label>Minimum watch time in seconds (0–120)</label>
            <input type="number" min="0" max="120" value={form.min_seconds} onChange={(e) => setForm({ ...form, min_seconds: e.target.value })} />
          </div>
          <div className="field">
            <label>Order in the app (lower number shows first)</label>
            <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "…" : editingId ? "Save changes" : "Add platform"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={closeForm}>
              Cancel
            </button>
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      {!showForm && error && <p className="error-text">{error}</p>}

      {platforms === null && <p className="hint">Loading…</p>}
      {platforms && platforms.length === 0 && (
        <p className="empty-state">No ad platforms yet. Tap "Add ad platform" to add your first one.</p>
      )}

      {platforms?.map((p) => (
        <div className="task" key={p.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="info">
            <p className="title">
              {p.label} {p.active ? "" : "(off)"}
            </p>
            <p className="reward">
              {PROVIDERS[p.provider]?.name || p.provider} · +{Number(p.reward)} {coinName} ·{" "}
              {p.daily_limit > 0 ? `${p.daily_limit}/day` : "no daily cap"} · {p.min_seconds}s
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost" onClick={() => startEdit(p)}>
              Edit
            </button>
            <button className="btn btn-ghost" onClick={() => toggle(p)}>
              {p.active ? "Turn off" : "Turn on"}
            </button>
            {confirmId === p.id ? (
              <>
                <button className="btn btn-primary" onClick={() => remove(p)}>
                  Yes, remove
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmId(null)}>
                  Keep
                </button>
              </>
            ) : (
              <button className="btn btn-ghost" onClick={() => setConfirmId(p.id)}>
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}