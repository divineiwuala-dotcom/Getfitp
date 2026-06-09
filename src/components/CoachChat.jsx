import { useState, useRef, useEffect } from "react";

export default function CoachChat({ messages = [], onSend, loading = false }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    onSend?.(text);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.wrap}>
      {/* Messages */}
      <div style={styles.messageList}>
        {messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.coachAvatar}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="#2563eb" strokeWidth="1.5" />
                <circle cx="14" cy="11" r="4" stroke="#2563eb" strokeWidth="1.5" />
                <path d="M6 24c0-4 4-6 8-6s8 2 8 6" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p style={styles.emptyTitle}>Coach is ready</p>
            <p style={styles.emptySub}>Ask about today's workout, swap exercises, or get motivation.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.msgRow,
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div style={styles.avatarSmall}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#2563eb" strokeWidth="1.2" />
                  <circle cx="8" cy="6.5" r="2.2" stroke="#2563eb" strokeWidth="1.2" />
                  <path d="M3.5 13c0-2.5 2-3.5 4.5-3.5s4.5 1 4.5 3.5" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              </div>
            )}
            <div
              style={{
                ...styles.bubble,
                ...(msg.role === "user" ? styles.userBubble : styles.coachBubble),
              }}
            >
              <p style={styles.bubbleText}>{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
            <div style={styles.avatarSmall}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#2563eb" strokeWidth="1.2" />
                <circle cx="8" cy="6.5" r="2.2" stroke="#2563eb" strokeWidth="1.2" />
                <path d="M3.5 13c0-2.5 2-3.5 4.5-3.5s4.5 1 4.5 3.5" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{ ...styles.bubble, ...styles.coachBubble }}>
              <div style={styles.typing}>
                <span style={{ ...styles.dot, animationDelay: "0ms" }} />
                <span style={{ ...styles.dot, animationDelay: "150ms" }} />
                <span style={{ ...styles.dot, animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask your coach..."
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            ...styles.sendBtn,
            opacity: input.trim() && !loading ? 1 : 0.4,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17 10L3 3l3 7-3 7 14-7z" fill="white" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: "40px 24px",
    textAlign: "center",
  },
  coachAvatar: {
    width: 56,
    height: 56,
    background: "#eff6ff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
    margin: "0 0 6px",
  },
  emptySub: {
    fontSize: 13,
    color: "#9ca3af",
    margin: 0,
    lineHeight: 1.5,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    background: "#eff6ff",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: 18,
  },
  userBubble: {
    background: "#2563eb",
    borderBottomRightRadius: 4,
  },
  coachBubble: {
    background: "white",
    borderBottomLeftRadius: 4,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    color: "inherit",
    whiteSpace: "pre-wrap",
  },
  typing: {
    display: "flex",
    gap: 4,
    alignItems: "center",
    padding: "2px 0",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#9ca3af",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  inputRow: {
    display: "flex",
    gap: 10,
    padding: "10px 16px 16px",
    background: "#f2f2f7",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: 24,
    border: "1.5px solid #e5e7eb",
    background: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 14,
    color: "#111",
    outline: "none",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#84cc16",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },
};
