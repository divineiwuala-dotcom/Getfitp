import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CoachChat from "../components/CoachChat";
import { chatWithCoach } from "../services/groq";
import { getUserProfile, getRecentHistory, getProgress, auth } from "../services/firebase";

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState(null);

  // Load profile + context once
  useEffect(() => {
    async function loadContext() {
      try {
        const [profile, history, progress] = await Promise.all([
          getUserProfile(),
          getRecentHistory(3),
          getProgress(),
        ]);
        setContext({ profile, history, progress });
      } catch (err) {
        console.error("Failed to load chat context:", err);
      }
    }
    loadContext();
  }, []);

  const handleSend = async (text) => {
    const userMsg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      // Use auth displayName as the real name (overrides stored 'Div' for Google users)
      const profile = context?.profile || {};
      const enrichedProfile = {
        ...profile,
        name: auth.currentUser?.displayName || profile.name || '',
      };
      const reply = await chatWithCoach(
        enrichedProfile,
        context?.history || [],
        next
      );
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect right now. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 17l-6-6 6-6" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={styles.headerCenter}>
          <div style={styles.coachDot} />
          <div>
            <p style={styles.headerTitle}>AI Coach</p>
            <p style={styles.headerSub}>Always here to help</p>
          </div>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Quick prompts — shown when no messages */}
      {messages.length === 0 && (
        <div style={styles.quickWrap}>
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              style={styles.quickBtn}
              onClick={() => handleSend(q)}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat */}
      <CoachChat messages={messages} onSend={handleSend} loading={loading} />
    </div>
  );
}

const quickPrompts = [
  "What's my workout today?",
  "My shoulders are sore, can we swap?",
  "How do I do a proper push-up?",
  "Am I overtraining?",
];

const styles = {
  page: {
    height: "100dvh",
    background: "#f2f2f7",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Figtree', sans-serif",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "52px 16px 14px",
    background: "white",
    borderBottom: "1px solid #f3f4f6",
    flexShrink: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: "#f2f2f7",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  coachDot: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#eff6ff",
    border: "2px solid #2563eb",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: "#111",
    margin: 0,
  },
  headerSub: {
    fontSize: 11,
    color: "#84cc16",
    fontWeight: 600,
    margin: 0,
  },
  quickWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    padding: "12px 16px",
    flexShrink: 0,
  },
  quickBtn: {
    padding: "8px 14px",
    borderRadius: 20,
    background: "white",
    border: "1.5px solid #e5e7eb",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: "#374151",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
};
