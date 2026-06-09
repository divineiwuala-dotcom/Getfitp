import { useState, useEffect, useCallback } from "react";
import { speakText } from "../services/voice";
import ExerciseInfo from "./ExerciseInfo";

/**
 * ExerciseCard — Full screen exercise experience
 *
 * Props:
 *   exercises  : Array of { name, sets, reps, rest, type, duration, videoId?, instructions? }
 *   onComplete : (reason?) => void  — called after last exercise or early finish
 *
 * type: "reps"  → shows rep count
 *       "timed" → shows countdown timer
 */
export default function ExerciseCard({ exercises = [], onComplete }) {
  const [exIdx, setExIdx]           = useState(0);
  const [setIdx, setSetIdx]         = useState(0);
  const [phase, setPhase]           = useState("active");   // "active" | "rest"
  const [restLeft, setRestLeft]     = useState(0);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [muted, setMuted]           = useState(true);       // start muted (autoplay requirement)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [otherSelected, setOtherSelected] = useState(false);
  const [otherText, setOtherText]   = useState('');
  const [showInfo, setShowInfo]     = useState(false);      // ExerciseInfo sheet

  const FINISH_REASONS = [
    "Got interrupted",
    "Too tired",
    "Feeling pain or discomfort",
    "Completed enough for today",
    "Other",
  ];

  const exercise       = exercises[exIdx];
  const totalExercises = exercises.length;
  const totalSets      = exercise?.sets || 3;
  const isTimed        = exercise?.type === "timed";
  const progress       = ((exIdx + setIdx / totalSets) / totalExercises) * 100;

  // Announce exercise when it changes
  useEffect(() => {
    if (!exercise) return;
    if (isTimed) {
      speakText(`${exercise.name}. ${totalSets} sets. ${exercise.duration || 30} seconds.`);
    } else {
      speakText(`${exercise.name}. ${totalSets} sets of ${exercise.reps} reps.`);
    }
    setTimeLeft(exercise.duration || 30);
    setTimerRunning(false);
  }, [exIdx]);

  // Timed exercise countdown
  useEffect(() => {
    if (!timerRunning || phase !== "active") return;
    if (timeLeft <= 0) { setTimerRunning(false); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timeLeft, phase]);

  // Rest countdown — auto-advance set when done
  useEffect(() => {
    if (phase !== "rest") return;
    if (restLeft <= 0) {
      setPhase("active");
      setTimeLeft(exercise?.duration || 30);
      setTimerRunning(false);
      return;
    }
    const t = setTimeout(() => setRestLeft((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restLeft]);

  const handleNext = useCallback(() => {
    if (phase === "rest") return;
    const isLastSet      = setIdx + 1 >= totalSets;
    const isLastExercise = exIdx + 1 >= totalExercises;

    if (isLastSet && isLastExercise) {
      speakText("Workout complete. Great job!");
      onComplete?.();
      return;
    }

    if (isLastSet) {
      setExIdx((i) => i + 1);
      setSetIdx(0);
      setPhase("active");
    } else {
      setSetIdx((s) => s + 1);
      const restSecs = exercise?.rest || 30;
      setRestLeft(restSecs);
      setPhase("rest");
      speakText(`Good set. Rest for ${restSecs} seconds.`);
    }
  }, [phase, setIdx, exIdx, totalSets, totalExercises, exercise]);

  const handleSkipExercise = useCallback(() => {
    if (exIdx + 1 >= totalExercises) {
      speakText("Workout complete. Great job!");
      onComplete?.();
      return;
    }
    setExIdx((i) => i + 1);
    setSetIdx(0);
    setPhase("active");
    setTimerRunning(false);
  }, [exIdx, totalExercises, onComplete]);

  const openFinishModal = () => {
    setOtherSelected(false);
    setOtherText('');
    setShowFinishModal(true);
  };

  const closeFinishModal = () => {
    setShowFinishModal(false);
    setOtherSelected(false);
    setOtherText('');
  };

  const handleReasonClick = (reason) => {
    if (reason === "Other") {
      setOtherSelected(true);
    } else {
      handleFinishEarly(reason);
    }
  };

  const handleFinishEarly = (reason) => {
    closeFinishModal();
    speakText("Well done for showing up today.");
    onComplete?.(reason);
  };

  // Build iframe src with mute param
  const videoSrc = exercise?.videoId
    ? `https://www.youtube.com/embed/${exercise.videoId}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${exercise.videoId}`
    : null;

  if (!exercise) {
    return (
      <div style={styles.page}>
        <p style={{ color: "#9ca3af", textAlign: "center", paddingTop: 80 }}>
          No exercises loaded.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div style={styles.topBar}>
        <span style={styles.exCounter}>{exIdx + 1} / {totalExercises}</span>

        {/* Exercise name + info icon */}
        <div style={styles.exNameWrap}>
          <span style={styles.exName}>{exercise.name}</span>
          {exercise.instructions && (
            <button
              style={styles.infoBtn}
              onClick={() => setShowInfo(true)}
              aria-label="Exercise instructions"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"/>
                <circle cx="8" cy="5.5" r="0.9" fill="rgba(255,255,255,0.5)"/>
                <path d="M8 8v4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        <span style={styles.setCounter}>Set {setIdx + 1} of {totalSets}</span>
      </div>

      {/* Video */}
      <div style={styles.videoWrap}>
        {videoSrc ? (
          <>
            <iframe
              key={`${exercise.videoId}-${muted}`}   // re-mount when mute changes
              style={styles.iframe}
              src={videoSrc}
              allow="autoplay"
              allowFullScreen
              title={exercise.name}
            />
            {/* Mute / unmute overlay button */}
            <button
              style={styles.muteBtn}
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                /* Speaker with X */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 7H2v6h2l5 4V3L4 7z" fill="white" />
                  <line x1="14" y1="7" x2="18" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="18" y1="7" x2="14" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                /* Speaker with waves */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 7H2v6h2l5 4V3L4 7z" fill="white" />
                  <path d="M13 7a4 4 0 010 6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M15.5 4.5a8 8 0 010 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </>
        ) : (
          <div style={styles.videoPlaceholder}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="22" stroke="#2563eb" strokeWidth="1.5" />
              <path d="M20 16l12 8-12 8V16z" fill="#2563eb" />
            </svg>
            <p style={styles.placeholderText}>Video coming soon</p>
          </div>
        )}
      </div>

      {/* Stats card */}
      <div style={styles.repsCard}>
        {isTimed ? (
          <div style={styles.timedWrap}>
            <div style={{
              ...styles.timedCircle,
              borderColor: timerRunning && timeLeft > 0 ? "#84cc16" : "rgba(255,255,255,0.1)",
            }}>
              <span style={styles.timedCount}>{timeLeft}</span>
              <span style={styles.timedSec}>sec</span>
            </div>
            <button
              style={{
                ...styles.timerToggle,
                background: timerRunning ? "rgba(239,68,68,0.15)" : "rgba(132,204,22,0.15)",
                color: timerRunning ? "#ef4444" : "#84cc16",
              }}
              onClick={() => {
                if (timeLeft <= 0) {
                  setTimeLeft(exercise.duration || 30);
                  setTimerRunning(true);
                } else {
                  setTimerRunning((r) => !r);
                }
              }}
            >
              {timerRunning ? "Pause" : timeLeft <= 0 ? "Restart" : "Start"}
            </button>
          </div>
        ) : (
          <div style={styles.repsRow}>
            <div style={styles.repsStat}>
              <span style={styles.repsVal}>{exercise.reps}</span>
              <span style={styles.repsLabel}>REPS</span>
            </div>
            <div style={styles.repsDivider} />
            <div style={styles.repsStat}>
              <span style={styles.repsVal}>{totalSets}</span>
              <span style={styles.repsLabel}>SETS</span>
            </div>
            <div style={styles.repsDivider} />
            <div style={styles.repsStat}>
              <span style={styles.repsVal}>{exercise.rest || 30}s</span>
              <span style={styles.repsLabel}>REST</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.nextBtn} onClick={handleNext}>
          {setIdx + 1 >= totalSets && exIdx + 1 >= totalExercises
            ? "Finish Phase ✓"
            : setIdx + 1 >= totalSets
            ? "Next Exercise →"
            : "Done Set ✓"}
        </button>
        <div style={styles.secondaryRow}>
          <button style={styles.secondaryBtn} onClick={handleSkipExercise}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h8M7 4l3 3-3 3" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 3v8" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Skip Exercise
          </button>
          <div style={styles.secondaryDivider} />
          <button style={styles.secondaryBtn} onClick={openFinishModal}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2" y="2" width="10" height="10" rx="2" stroke="#6b7280" strokeWidth="1.4" />
              <path d="M5 5l4 4M9 5l-4 4" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Finish Early
          </button>
        </div>
      </div>

      {/* Rest overlay */}
      {phase === "rest" && (
        <div style={styles.restOverlay}>
          <div style={styles.restCard}>
            <p style={styles.restTitle}>REST</p>
            <p style={styles.restTimer}>{restLeft}</p>
            <p style={styles.restSub}>seconds</p>
            <button style={styles.skipRestBtn} onClick={() => setRestLeft(0)}>
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Finish early modal */}
      {showFinishModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>

            {otherSelected ? (
              <>
                <p style={styles.modalTitle}>What's going on?</p>
                <p style={styles.modalSub}>Type your reason below.</p>
                <textarea
                  style={styles.otherInput}
                  placeholder="e.g. Had to leave for an appointment…"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  rows={3}
                  autoFocus
                />
                <button
                  style={styles.cancelBtn}
                  onClick={() => handleFinishEarly(otherText.trim() || "Other")}
                >
                  Done
                </button>
                <button
                  style={styles.backBtn}
                  onClick={() => setOtherSelected(false)}
                >
                  ← Back
                </button>
              </>
            ) : (
              /* Default — reason list */
              <>
                <p style={styles.modalTitle}>Why do you want to finish early?</p>
                <p style={styles.modalSub}>No judgement — this helps your coach adapt.</p>
                <div style={styles.reasonList}>
                  {FINISH_REASONS.map((reason) => (
                    <button
                      key={reason}
                      style={styles.reasonBtn}
                      onClick={() => handleReasonClick(reason)}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <button style={styles.cancelBtn} onClick={closeFinishModal}>
                  Keep Going
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* Exercise Info sheet */}
      {showInfo && (
        <ExerciseInfo
          exercise={exercise}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "#0f172a",
    maxWidth: 430,
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Figtree', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  progressTrack: { height: 4, background: "rgba(255,255,255,0.1)", width: "100%", flexShrink: 0 },
  progressFill:  { height: "100%", background: "#84cc16", transition: "width 0.4s ease", borderRadius: "0 2px 2px 0" },

  topBar:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 12px", flexShrink: 0 },
  exCounter: { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, minWidth: 32 },
  setCounter:{ fontSize: 12, color: "#84cc16", fontWeight: 600, minWidth: 60, textAlign: "right" },

  // Exercise name row with info icon
  exNameWrap: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    padding: "0 8px",
  },
  exName: {
    fontSize: 16,
    fontWeight: 700,
    color: "white",
    textAlign: "center",
  },
  infoBtn: {
    background: "none",
    border: "none",
    padding: 4,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  videoWrap: {
    flex: 1,
    margin: "0 16px",
    borderRadius: 20,
    overflow: "hidden",
    background: "#1e293b",
    minHeight: 220,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iframe:           { width: "100%", height: "100%", border: "none", minHeight: 220 },
  videoPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  placeholderText:  { fontSize: 13, color: "rgba(255,255,255,0.3)", margin: 0 },

  muteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.55)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 5,
  },

  repsCard: { margin: "16px 16px 0", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: "18px 0", flexShrink: 0 },
  repsRow:  { display: "flex", alignItems: "center", justifyContent: "center" },
  repsStat: { display: "flex", flexDirection: "column", alignItems: "center", flex: 1 },
  repsVal:  { fontSize: 28, fontWeight: 800, color: "white", lineHeight: 1 },
  repsLabel:{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500, marginTop: 4 },
  repsDivider: { width: 1, height: 36, background: "rgba(255,255,255,0.1)" },

  timedWrap:   { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "4px 0" },
  timedCircle: { width: 100, height: 100, borderRadius: "50%", border: "3px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", transition: "border-color 0.3s" },
  timedCount:  { fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1 },
  timedSec:    { fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 },
  timerToggle: { padding: "8px 28px", border: "none", borderRadius: 12, fontFamily: "'Figtree', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" },

  footer: { padding: "16px 16px 32px", flexShrink: 0 },
  nextBtn: {
    width: "100%",
    padding: "18px",
    background: "#84cc16",
    color: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    border: "none",
    borderRadius: 16,
    cursor: "pointer",
    marginBottom: 10,
  },
  secondaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  secondaryBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px",
    background: "transparent",
    border: "none",
    color: "#6b7280",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryDivider: {
    width: 1,
    height: 20,
    background: "rgba(255,255,255,0.1)",
  },

  restOverlay: { position: "absolute", inset: 0, background: "rgba(15,23,42,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  restCard:    { background: "#1e293b", borderRadius: 24, padding: "40px 48px", textAlign: "center" },
  restTitle:   { fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" },
  restTimer:   { fontSize: 72, fontWeight: 800, color: "#84cc16", margin: "0 0 8px", lineHeight: 1 },
  restSub:     { fontSize: 14, color: "rgba(255,255,255,0.4)", margin: "0 0 24px" },
  skipRestBtn: { padding: "10px 24px", background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'Figtree', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" },

  modalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15,23,42,0.92)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 20,
    padding: "0 0 24px",
  },
  modalCard: {
    background: "#1e293b",
    borderRadius: 24,
    padding: "28px 20px 20px",
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 6px", textAlign: "center" },
  modalSub:   { fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px", textAlign: "center" },
  reasonList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
  reasonBtn: {
    width: "100%",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "left",
  },
  cancelBtn: {
    width: "100%",
    padding: "14px",
    background: "#84cc16",
    border: "none",
    borderRadius: 14,
    color: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  backBtn: {
    width: "100%",
    padding: "12px",
    marginTop: 8,
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textAlign: "center",
  },
  otherInput: {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    fontFamily: "'Figtree', sans-serif",
    fontSize: 15,
    resize: "none",
    outline: "none",
    marginBottom: 14,
    boxSizing: "border-box",
    lineHeight: 1.5,
  },
};
