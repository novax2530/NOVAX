import { Fragment } from "react";

// Tiny, safe renderer for Minibot replies. Builds React elements only
// (no dangerouslySetInnerHTML), so AI output can never inject HTML.
// Supports **bold**, "- " / "* " bullet lines, and http(s) links.

const INLINE = /(\*\*[^*]+\*\*|https?:\/\/[^\s<>()]+)/g;

function renderInline(text, keyBase) {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <b key={key}>{part.slice(2, -2)}</b>;
    }
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={key} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function RichText({ text }) {
  const lines = String(text ?? "").split("\n");
  const out = [];
  let bullets = [];

  const flush = (k) => {
    if (bullets.length) {
      out.push(
        <ul key={`ul-${k}`}>
          {bullets.map((b, i) => (
            <li key={i}>{renderInline(b, `li-${k}-${i}`)}</li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };

  lines.forEach((line, i) => {
    const m = line.match(/^\s*[-*]\s+(.*)$/);
    if (m) {
      bullets.push(m[1]);
    } else {
      flush(i);
      out.push(
        <Fragment key={`l-${i}`}>
          {renderInline(line, `p-${i}`)}
          {i < lines.length - 1 ? "\n" : null}
        </Fragment>
      );
    }
  });
  flush(lines.length);
  return <>{out}</>;
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function ChatBubble({ message, onRetry }) {
  const isUser = message.role === "user";
  const failed = message.status === "failed";

  return (
    <div className={`msg ${message.role}${failed ? " error" : ""}`}>
      <div className="bubble">{isUser ? message.content : <RichText text={message.content} />}</div>
      {failed ? (
        <div>
          <span className="time" style={{ color: "var(--danger)" }}>
            {message.error || "Couldn't send."}
          </span>
          <button className="retry" onClick={() => onRetry(message)}>
            Retry
          </button>
        </div>
      ) : (
        <span className="time">{message.status === "sending" ? "Sending…" : formatTime(message.created_at)}</span>
      )}
    </div>
  );
}

export function TypingBubble() {
  return (
    <div className="msg assistant" aria-live="polite" aria-label="Nova X Minibot is typing">
      <div className="bubble typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
