import { useEffect, useState } from "react";
import { callApi } from "../lib/api";

const SUBTABS = ["Overview", "Tasks", "Super Tasks", "Submissions", "Withdrawals", "Admins", "Settings"];

export default function Admin({ settings, onSettingsChange }) {
  const [sub, setSub] = useState("Overview");

  return (
    <div className="section">
      <div className="section-title">Admin</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {SUBTABS.map((t) => (
          <button
            key={t}
            className={sub === t ? "btn btn-primary" : "btn btn-ghost"}
            onClick={() => setSub(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {sub === "Overview" && <Overview />}
      {sub === "Tasks" && <TaskManager />}
      {sub === "Super Tasks" && <SuperTaskManager />}
      {sub === "Submissions" && <SubmissionsManager />}
      {sub === "Withdrawals" && <WithdrawalManager coinName={settings.coin_name} />}
      {sub === "Admins" && <AdminsManager />}
      {sub === "Settings" && <SettingsPanel settings={settings} onSettingsChange={onSettingsChange} />}
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    callApi("admin_stats").then((d) => setStats(d));
  }, []);
  if (!stats) return <p className="hint">Loading…</p>;
  return (
    <div className="stat-grid">
      <div className="stat-box">
        <div className="num">{stats.users}</div>
        <div className="label">Users</div>
      </div>
      <div className="stat-box">
        <div className="num">{Number(stats.coinsInCirculation ?? 0).toLocaleString()}</div>
        <div className="label">Coins in circulation</div>
      </div>
      <div className="stat-box">
        <div className="num">{stats.pendingWithdrawals}</div>
        <div className="label">Pending withdrawals</div>
      </div>
      <div className="stat-box">
        <div className="num">{stats.pendingSubmissions ?? 0}</div>
        <div className="label">Pending proofs</div>
      </div>
    </div>
  );
}

function TaskManager() {
  const [tasks, setTasks] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", reward: "", link: "", verifyChat: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { tasks } = await callApi("tasks");
    setTasks(tasks);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(t) {
    setEditingId(t.id);
    setForm({ title: t.title, description: t.description || "", reward: t.reward, link: t.link || "", verifyChat: t.channel_chat || "" });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", reward: "", link: "", verifyChat: "" });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.reward) {
      setError("Title and reward are required");
      return;
    }
    const { verifyChat, ...rest } = form;
    const payload = {
      ...rest,
      verification: verifyChat ? "channel_join" : "none",
      channel_chat: verifyChat || null,
    };
    try {
      if (editingId) {
        await callApi("admin_update_task", { taskId: editingId, ...payload });
      } else {
        await callApi("admin_add_task", payload);
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(t) {
    await callApi("admin_toggle_task", { taskId: t.id, active: !t.active });
    load();
  }

  return (
    <div>
      <form onSubmit={save} style={{ marginBottom: 20 }}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label>Reward (coins)</label>
          <input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
        </div>
        <div className="field">
          <label>Link (optional)</label>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
        </div>
        <div className="field">
          <label>Auto-verify channel/group (optional)</label>
          <input
            value={form.verifyChat}
            onChange={(e) => setForm({ ...form, verifyChat: e.target.value })}
            placeholder="@channelusername or -100xxxxxxxxxx"
          />
          <p className="hint">
            If set, the reward is only credited once we've confirmed the user actually joined this
            chat — no manual review needed. The bot must already be a member of it.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary">{editingId ? "Save changes" : "Add task"}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {tasks?.map((t) => (
        <div className="task" key={t.id}>
          <div className="info">
            <p className="title">{t.title}</p>
            <p className="reward">+{t.reward} coins {t.active ? "" : "(inactive)"}</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost" onClick={() => startEdit(t)}>
              Edit
            </button>
            <button className="btn btn-ghost" onClick={() => toggle(t)}>
              {t.active ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SuperTaskManager() {
  const [tasks, setTasks] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", reward: "", link: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    const { tasks } = await callApi("super_tasks");
    setTasks(tasks);
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(t) {
    setEditingId(t.id);
    setForm({ title: t.title, description: t.description || "", reward: t.reward, link: t.link || "" });
  }
  function resetForm() {
    setEditingId(null);
    setForm({ title: "", description: "", reward: "", link: "" });
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    if (!form.title || !form.reward) {
      setError("Title and reward are required");
      return;
    }
    try {
      if (editingId) {
        await callApi("admin_update_super_task", { taskId: editingId, ...form });
      } else {
        await callApi("admin_add_super_task", form);
      }
      resetForm();
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(t) {
    await callApi("admin_toggle_super_task", { taskId: t.id, active: !t.active });
    load();
  }

  return (
    <div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Users complete these outside the app and upload a screenshot as proof. You approve or
        reject each submission directly from your Telegram chat with the bot.
      </p>
      <form onSubmit={save} style={{ marginBottom: 20 }}>
        <div className="field">
          <label>Title</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Description (optional)</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="field">
          <label>Reward (coins)</label>
          <input type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} />
        </div>
        <div className="field">
          <label>Link (optional — where the user should go to do the task)</label>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary">{editingId ? "Save changes" : "Add super task"}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
      </form>

      {tasks?.map((t) => (
        <div className="task" key={t.id}>
          <div className="info">
            <p className="title">{t.title}</p>
            <p className="reward">+{t.reward} coins {t.active ? "" : "(inactive)"}</p>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost" onClick={() => startEdit(t)}>
              Edit
            </button>
            <button className="btn btn-ghost" onClick={() => toggle(t)}>
              {t.active ? "Disable" : "Enable"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SubmissionsManager() {
  const [submissions, setSubmissions] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const { submissions } = await callApi("admin_list_submissions");
    setSubmissions(submissions);
  }
  useEffect(() => {
    load();
  }, []);

  async function process(s, status) {
    setBusyId(s.id);
    try {
      await callApi("admin_process_submission", { submissionId: s.id, decision: status });
      load();
    } finally {
      setBusyId(null);
    }
  }

  if (!submissions) return <p className="hint">Loading…</p>;

  return (
    <div>
      <p className="hint" style={{ marginBottom: 12 }}>
        The screenshot itself only lives in your Telegram chat with the bot — check it there
        before approving. This just lets you record the decision from here instead.
      </p>
      {submissions.length === 0 && <p className="empty-state">No submissions yet.</p>}
      {submissions.map((s) => (
        <div className="task" key={s.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="info">
            <p className="title">{s.super_tasks?.title}</p>
            <p className="reward">
              +{s.super_tasks?.reward} coins · from @{s.profiles?.username || s.profiles?.first_name || s.profiles?.telegram_id}
            </p>
            <p className="hint">{new Date(s.submitted_at).toLocaleString()}</p>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span className={`wd-status ${s.status}`}>{s.status}</span>
            {s.status === "pending" && (
              <>
                <button className="btn btn-done" disabled={busyId === s.id} onClick={() => process(s, "approved")}>
                  Approve
                </button>
                <button className="btn btn-ghost" disabled={busyId === s.id} onClick={() => process(s, "rejected")}>
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminsManager() {
  const [admins, setAdmins] = useState(null);
  const [newId, setNewId] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { admins } = await callApi("admin_list_admins");
    setAdmins(admins);
  }
  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    if (!newId.trim()) return;
    try {
      await callApi("admin_add_admin", { telegramId: newId.trim() });
      setNewId("");
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(telegramId) {
    await callApi("admin_remove_admin", { telegramId });
    load();
  }

  return (
    <div>
      <p className="hint" style={{ marginBottom: 12 }}>
        Anyone listed here gets full admin access — tasks, withdrawals, settings, everything.
      </p>
      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={newId}
          onChange={(e) => setNewId(e.target.value)}
          placeholder="Telegram numeric ID"
          style={{
            flex: 1,
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 9,
            padding: "11px 12px",
            color: "var(--text)",
          }}
        />
        <button className="btn btn-primary">Add</button>
      </form>
      {error && <p className="error-text">{error}</p>}

      {admins?.map((a) => (
        <div className="task" key={a.telegram_id}>
          <div className="info">
            <p className="title">{a.telegram_id}</p>
            <p className="hint">Added {new Date(a.added_at).toLocaleDateString()}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => remove(a.telegram_id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function WithdrawalManager({ coinName }) {
  const [withdrawals, setWithdrawals] = useState(null);

  async function load() {
    const { withdrawals } = await callApi("admin_list_withdrawals");
    setWithdrawals(withdrawals);
  }
  useEffect(() => {
    load();
  }, []);

  async function process(w, status) {
    await callApi("admin_process_withdrawal", { withdrawalId: w.id, status });
    load();
  }

  if (!withdrawals) return <p className="hint">Loading…</p>;

  return (
    <div>
      {withdrawals.length === 0 && <p className="empty-state">No withdrawal requests.</p>}
      {withdrawals.map((w) => (
        <div className="task" key={w.id} style={{ flexDirection: "column", alignItems: "stretch" }}>
          <div className="info">
            <p className="title">
              @{w.profiles?.username || w.profiles?.first_name || w.profiles?.telegram_id}
            </p>
            <p className="reward">
              {w.amount} {coinName} → {w.wallet_address}
            </p>
            <p className="hint">{new Date(w.requested_at).toLocaleString()}</p>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <span className={`wd-status ${w.status}`}>{w.status}</span>
            {w.status === "pending" && (
              <>
                <button className="btn btn-done" onClick={() => process(w, "approved")}>
                  Approve
                </button>
                <button className="btn btn-ghost" onClick={() => process(w, "rejected")}>
                  Reject
                </button>
              </>
            )}
            {w.status === "approved" && (
              <button className="btn btn-primary" onClick={() => process(w, "paid")}>
                Mark paid
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SettingsPanel({ settings, onSettingsChange }) {
  const [form, setForm] = useState({
    coin_name: settings.coin_name || "Nova Coin",
    bot_username: settings.bot_username || "",
    referral_reward: settings.referral_reward ?? 200,
    coin_to_usdt_rate: settings.coin_to_usdt_rate ?? 0.00001,
    withdrawal_window_start_hour: settings.withdrawal_window_start_hour ?? 8,
    withdrawal_window_end_hour: settings.withdrawal_window_end_hour ?? 20,
    withdrawal_timezone_offset_hours: settings.withdrawal_timezone_offset_hours ?? 0,
    adsgram_block_id: settings.adsgram_block_id || "",
    adsgram_task_block_id: settings.adsgram_task_block_id || "",
    ad_reward_coins: settings.ad_reward_coins ?? 10,
    ad_daily_limit: settings.ad_daily_limit ?? 20,
  });
  const [channels, setChannels] = useState(settings.required_channels || []);
  const [saved, setSaved] = useState(false);

  async function saveField(key, value) {
    await callApi("admin_set_setting", { key, value });
  }

  async function saveAll(e) {
    e.preventDefault();
    await Promise.all([
      saveField("coin_name", form.coin_name),
      saveField("bot_username", form.bot_username),
      saveField("referral_reward", Number(form.referral_reward)),
      saveField("coin_to_usdt_rate", Number(form.coin_to_usdt_rate)),
      saveField("withdrawal_window_start_hour", Number(form.withdrawal_window_start_hour)),
      saveField("withdrawal_window_end_hour", Number(form.withdrawal_window_end_hour)),
      saveField("withdrawal_timezone_offset_hours", Number(form.withdrawal_timezone_offset_hours)),
      saveField("adsgram_block_id", form.adsgram_block_id),
      saveField("adsgram_task_block_id", form.adsgram_task_block_id),
      saveField("ad_reward_coins", Number(form.ad_reward_coins)),
      saveField("ad_daily_limit", Number(form.ad_daily_limit)),
    ]);
    setSaved(true);
    onSettingsChange({ ...settings, ...form });
    setTimeout(() => setSaved(false), 1500);
  }

  function updateChannel(i, key, value) {
    const next = [...channels];
    next[i] = { ...next[i], [key]: value };
    setChannels(next);
  }
  function addChannel() {
    setChannels([...channels, { chat: "", label: "", url: "" }]);
  }
  function removeChannel(i) {
    setChannels(channels.filter((_, idx) => idx !== i));
  }
  async function saveChannels() {
    await saveField("required_channels", channels);
    onSettingsChange({ ...settings, required_channels: channels });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div>
      <form onSubmit={saveAll}>
        <div className="field">
          <label>Coin name</label>
          <input value={form.coin_name} onChange={(e) => setForm({ ...form, coin_name: e.target.value })} />
        </div>
        <div className="field">
          <label>Bot username (no @)</label>
          <input value={form.bot_username} onChange={(e) => setForm({ ...form, bot_username: e.target.value })} placeholder="novax_bot" />
        </div>
        <div className="field">
          <label>Referral reward (coins per invite)</label>
          <input
            type="number"
            value={form.referral_reward}
            onChange={(e) => setForm({ ...form, referral_reward: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Coin → USDT rate (e.g. 0.00001 means 100,000 coins = 1 USDT)</label>
          <input
            type="number"
            step="0.000001"
            value={form.coin_to_usdt_rate}
            onChange={(e) => setForm({ ...form, coin_to_usdt_rate: e.target.value })}
          />
        </div>
        <p className="hint" style={{ marginTop: -6, marginBottom: 14 }}>
          Minimum withdrawal is always the coin equivalent of 1 USDT — it follows this rate automatically.
        </p>

        <div className="field">
          <label>Withdrawal window — start hour (0–23)</label>
          <input type="number" min="0" max="23" value={form.withdrawal_window_start_hour} onChange={(e) => setForm({ ...form, withdrawal_window_start_hour: e.target.value })} />
        </div>
        <div className="field">
          <label>Withdrawal window — end hour (0–23)</label>
          <input type="number" min="0" max="23" value={form.withdrawal_window_end_hour} onChange={(e) => setForm({ ...form, withdrawal_window_end_hour: e.target.value })} />
        </div>
        <div className="field">
          <label>Timezone offset from UTC (hours)</label>
          <input type="number" value={form.withdrawal_timezone_offset_hours} onChange={(e) => setForm({ ...form, withdrawal_timezone_offset_hours: e.target.value })} />
        </div>

        <div className="field">
          <label>Adsgram block ID (Watch Ad button)</label>
          <input value={form.adsgram_block_id} onChange={(e) => setForm({ ...form, adsgram_block_id: e.target.value })} placeholder="int-xxxxx" />
        </div>
        <div className="field">
          <label>Adsgram task block ID (Sponsored Task button, optional)</label>
          <input value={form.adsgram_task_block_id} onChange={(e) => setForm({ ...form, adsgram_task_block_id: e.target.value })} placeholder="task-xxxxx" />
        </div>
        <div className="field">
          <label>Reward per ad view (coins)</label>
          <input type="number" value={form.ad_reward_coins} onChange={(e) => setForm({ ...form, ad_reward_coins: e.target.value })} />
        </div>
        <div className="field">
          <label>Max ad views per user per day (0 = unlimited)</label>
          <input type="number" value={form.ad_daily_limit} onChange={(e) => setForm({ ...form, ad_daily_limit: e.target.value })} />
        </div>

        <button className="btn btn-primary" style={{ width: "100%" }}>
          Save settings
        </button>
      </form>

      <div className="section-title" style={{ marginTop: 24 }}>
        Required channels/groups
      </div>
      <p className="hint" style={{ marginBottom: 10 }}>
        Users must join all of these before they can use the app. The bot must already be a
        member (ideally admin) of each one, or the check will always fail.
      </p>
      {channels.map((c, i) => (
        <div key={i} className="task" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
          <div className="field" style={{ marginBottom: 6 }}>
            <label>Chat ID or @username</label>
            <input value={c.chat} onChange={(e) => updateChannel(i, "chat", e.target.value)} placeholder="@yourchannel" />
          </div>
          <div className="field" style={{ marginBottom: 6 }}>
            <label>Display label</label>
            <input value={c.label} onChange={(e) => updateChannel(i, "label", e.target.value)} placeholder="Main Channel" />
          </div>
          <div className="field" style={{ marginBottom: 6 }}>
            <label>Join URL</label>
            <input value={c.url} onChange={(e) => updateChannel(i, "url", e.target.value)} placeholder="https://t.me/yourchannel" />
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => removeChannel(i)}>
            Remove
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={addChannel}>
          + Add channel
        </button>
        <button type="button" className="btn btn-primary" onClick={saveChannels}>
          Save channels
        </button>
      </div>

      {saved && <p className="hint" style={{ color: "var(--success)", marginTop: 10 }}>Saved.</p>}
    </div>
  );
}
