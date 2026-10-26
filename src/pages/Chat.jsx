import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { callApi } from "../lib/api";
import ChatBubble, { TypingBubble } from "../components/ChatBubble";

const MAX_LEN = 1000;
const SUGGESTIONS = [
  "How do I earn faster?",
  "Explain Nova Coin",
  "Give me a trivia question",
  "What can you do?",
];

let tempCounter = 0;
const tempId = () => `tmp-${Date.now()}-${tempCounter++}`;

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const atBottomRef = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await callApi("chat_history", { limit: 50 });
      setMessages(data.messages || []);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // First paint after history loads: jump straight to the newest message.
  useLayoutEffect(() => {
    if (!loading) scrollToBottom(false);
  }, [loading, scrollToBottom]);

  // New messages: follow along only if the user hasn't scrolled up.
  useEffect(() => {
    if (loading) return;
    if (atBottomRef.current) scrollToBottom(true);
    else setShowJump(true);
  }, [messages, sending, loading, scrollToBottom]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    atBottomRef.current = near;
    if (near) setShowJump(false);
  }

  // Auto-grow the textarea up to ~4 lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [text]);

  async function deliver(content, existingTempId) {
    const id = existingTempId || tempId();
    const optimistic = {
      id,
      role: "user",
      content,
      status: "sending",
      created_at: new Date().toISOString(),
    };
    atBottomRef.current = true;
    setSending(true);
    setMessages((m) =>
      existingTempId
        ? m.map((x) => (x.id === id ? optimistic : x))
        : [...m, optimistic]
    );

    try {
      const data = await callApi("chat_send", { message: content });
      setMessages((m) => [
        ...m.filter((x) => x.id !== id),
        data.userMessage,
        data.reply,
      ]);
    } catch (e) {
      const friendly =
        e.status === 429
          ? "Slow down a little, then try again."
          : e.code === "NETWORK"
          ? "You seem to be offline."
          : e.message || "Couldn't send.";
      setMessages((m) =>
        m.map((x) => (x.id === id ? { ...x, status: "failed", error: friendly } : x))
      );
    } finally {
      setSending(false);
    }
  }

  function send(content) {
    const clean = content.trim();
    if (!clean || sending || clean.length > MAX_LEN) return;
    setText("");
    deliver(clean);
  }

  function onKeyDown(e) {
    // Enter sends on desktop; on touch keyboards Enter inserts a newline.
    const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
    if (e.key === "Enter" && !e.shiftKey && !isTouch) {
      e.preventDefault();
      send(text);
    }
  }

  async function clearChat() {
    setConfirmClear(false);
    try {
      await callApi("chat_clear");
      setMessages([]);
    } catch (e) {
      setLoadError(e.message);
    }
  }

  const empty = !loading && !loadError && messages.length === 0;
  const tooLong = text.length > MAX_LEN;
  const nearLimit = text.length > MAX_LEN - 100;

  return (
    <div className="chat">
      <div className="chat-head">
        <div className="bot-avatar" aria-hidden="true">
          ✦
        </div>
        <div className="who">
          <div className="name">Nova X Minibot</div>
          <div className={`status${sending ? " busy" : ""}`}>
            <i />
            {sending ? "Thinking…" : "Online"}
          </div>
        </div>
        {messages.length > 0 && (
          <button className="chat-menu-btn" onClick={() => setConfirmClear(true)} aria-label="Clear chat" title="Clear chat">
            🗑
          </button>
        )}
      </div>

      <div className="chat-list" ref={listRef} onScroll={onScroll} role="log" aria-live="polite">
        {loading && (
          <div className="center-screen" style={{ minHeight: 0, flex: 1 }}>
            <div className="spinner" />
          </div>
        )}

        {loadError && (
          <div className="empty-state">
            <p style={{ color: "var(--danger)" }}>{loadError}</p>
            <button className="btn btn-ghost" onClick={loadHistory}>
              Try again
            </button>
          </div>
        )}

        {empty && (
          <div className="chat-empty">
            <div className="bot-avatar" aria-hidden="true">
              ✦
            </div>
            <h3>Hi, I'm Nova X Minibot</h3>
            <p>
              Ask me about Nova Coin, play trivia, or look something up. Pick a
              starter or type your own message.
            </p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)} disabled={sending}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} onRetry={(msg) => deliver(msg.content, msg.id)} />
        ))}
        {sending && <TypingBubble />}
      </div>

      {showJump && (
        <button
          className="jump-latest"
          onClick={() => {
            atBottomRef.current = true;
            setShowJump(false);
            scrollToBottom(true);
          }}
        >
          Jump to latest ↓
        </button>
      )}

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <div className="box">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            placeholder="Message Nova X Minibot"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Message"
          />
          {nearLimit && (
            <span className="count">
              {text.length}/{MAX_LEN}
            </span>
          )}
        </div>
        <button
          className="send-btn"
          type="submit"
          disabled={!text.trim() || sending || tooLong}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>

      {confirmClear && (
        <div className="sheet-backdrop" onClick={() => setConfirmClear(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h4>Clear this chat?</h4>
            <p>This deletes your conversation with Nova X Minibot. It can't be undone.</p>
            <div className="row">
              <button className="btn btn-ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={clearChat}>
                Clear chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
