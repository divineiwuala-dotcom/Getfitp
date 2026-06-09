// ─── GitHub Models — GPT-4.1 mini ─────────────────────────────
// Replaces groq.js. Same exported functions, better model.
// Endpoint is OpenAI-compatible, auth uses your GitHub PAT.

const GITHUB_TOKEN = import.meta.env.VITE_OPENAI_API_KEY;
const BASE_URL     = 'https://models.inference.ai.azure.com';
const MODEL        = 'gpt-4.1-mini';

// ─── Shared fetch helper (JSON responses) ─────────────────────

async function fetchAI(messages, maxTokens = 2000, retries = 0) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model:      MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  // Rate limit — wait 15s and retry (shorter than Groq since limits reset faster)
  if (res.status === 429) {
    if (retries < 2) {
      console.warn('Rate limited. Retrying in 15s...');
      await new Promise(r => setTimeout(r, 15000));
      return fetchAI(messages, maxTokens, retries + 1);
    }
    throw new Error('Rate limit reached. Please try again in a moment.');
  }

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error: ${err}`);
  }

  const data = await res.json();
  const text = data.choices[0].message.content;

  // Strip markdown code fences if model wraps output
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Fallback: extract first JSON object from response
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Failed to parse JSON from AI response');
  }
}

// ─── Daily session generation ──────────────────────────────────

export async function generateDailySession(
  profile,
  history = [],
  sessionSetup = null,
  feelingToday = null
) {
  const recentRatings = history.slice(0, 3)
    .map(h => `${h.muscleGroup} — rated: ${h.rating || 'unrated'}`)
    .join('\n') || 'No history yet — this is their first session.';

  const lastDate      = history[0]?.date ? new Date(history[0].date) : null;
  const daysSinceLast = lastDate
    ? Math.floor((Date.now() - lastDate.getTime()) / 86400000)
    : 99;

  const lastRating    = history[0]?.rating || null;
  const recentMuscles = history.slice(0, 3).map(h => h.muscleGroup).filter(Boolean);

  const equipment = Array.isArray(profile.equipment)
    ? profile.equipment.join(', ')
    : profile.equipment || 'bodyweight';
  const injuries = Array.isArray(profile.injuries)
    ? profile.injuries.join(', ')
    : profile.injuries || 'none';

  // ── Session setup block (time allocation) ──
  const setupBlock = sessionSetup
    ? `
Time allocation chosen by ${profile.name || 'the user'} for today:
- Warmup: ${sessionSetup.warmupDuration} minutes
- Main workout: ${sessionSetup.workoutDuration} minutes
- Recovery: ${sessionSetup.recoveryDuration} minutes (${sessionSetup.recoveryType})

Generate exercises that fill these exact durations:
- warmup block: fill ${sessionSetup.warmupDuration} minutes with light mobilisation movements
- exercises block: fill ${sessionSetup.workoutDuration} minutes with main work
- recovery block: fill ${sessionSetup.recoveryDuration} minutes using ${sessionSetup.recoveryType} only`
    : `
Time allocation: medium session (~15–25 min total)`;

  // ── Feeling block (AI intensity adaptation) ──
  const feelingBlock = feelingToday
    ? `
How ${profile.name || 'the user'} feels today: "${feelingToday}"
Adapt the session accordingly:
- fresh  → increase intensity, add sets, reduce rest to 20s
- good   → normal session as planned
- tired  → reduce volume ~20%, increase rest to 40s, lighter exercises
- sore   → very light session, avoid yesterday's muscle group entirely, prioritise mobility and stretching`
    : '';

  const systemPrompt = `You are an expert personal fitness coach. You generate structured workout sessions as valid JSON only. Never add markdown, explanation, or extra text outside the JSON object.`;

  const userPrompt = `Generate TODAY's workout session for ${profile.name}.

Profile:
- Age: ${profile.age || 18}, Weight: ${profile.weight || '66kg'}, Height: ${profile.height || "5'9\""}
- Goal: ${profile.goal} (athletic = lean, defined, proportional — not bulky)
- Level: ${profile.level}
- Equipment: ${equipment}
- Injuries/limitations: ${injuries}
- Training days: ${Array.isArray(profile.days) ? profile.days.join(', ') : profile.days}
${setupBlock}
${feelingBlock}

Recent workout history (last 3):
${recentRatings}

Context:
- Days since last workout: ${daysSinceLast}
- Last session rating: ${lastRating || 'N/A'}
- Recently trained muscle groups: ${recentMuscles.join(', ') || 'none'}

Adaptation rules (follow strictly):
- Last rating "hard" → reduce intensity ~20%, add more rest
- Last rating "easy" → increase reps/sets, reduce rest
- Last rating "perfect" → keep similar difficulty
- daysSinceLast >= 3 → lighter recovery-focused session
- Avoid the same muscle group as last session
- Never include exercises that conflict with injuries

Exercise rules:
- Each exercise must have a "type" field: "reps" or "timed"
- "reps" → use sets + reps as a SINGLE INTEGER (e.g. 12, not "10-12")
- "timed" → use sets + duration in seconds (e.g. 30), omit "reps"
- Mix both types: ~60% reps, ~40% timed
- rest is always 30 seconds between sets

Instructions rules (for every exercise in warmup, exercises, and recovery):
- "hints": 1–2 short form cues (e.g. "Keep your core tight. Don't let your hips drop.")
- "breathing": one short sentence (e.g. "Exhale on the effort, inhale on the return.")
- "muscles.primary": array of main muscle groups worked. Use plain English names (e.g. "chest", "quads", "abs", "glutes", "hamstrings", "shoulders", "biceps", "triceps", "calves", "lats", "traps", "lower back", "hip flexors", "obliques")
- "muscles.secondary": array of supporting muscle groups (same naming convention, can be empty array)

Return ONLY this JSON structure, nothing else:
{
  "muscleGroup": "string",
  "sessionType": "string",
  "tomorrowFocus": "string",
  "warmup": [
    {
      "name": "string",
      "duration": 30,
      "type": "timed",
      "instructions": {
        "hints": "string",
        "breathing": "string",
        "muscles": { "primary": ["string"], "secondary": ["string"] }
      }
    }
  ],
  "exercises": [
    {
      "name": "string",
      "sets": 3,
      "reps": 12,
      "rest": 30,
      "type": "reps",
      "instructions": {
        "hints": "string",
        "breathing": "string",
        "muscles": { "primary": ["string"], "secondary": ["string"] }
      }
    },
    {
      "name": "string",
      "sets": 3,
      "duration": 30,
      "rest": 30,
      "type": "timed",
      "instructions": {
        "hints": "string",
        "breathing": "string",
        "muscles": { "primary": ["string"], "secondary": ["string"] }
      }
    }
  ],
  "recovery": [
    {
      "name": "string",
      "duration": 40,
      "type": "timed",
      "instructions": {
        "hints": "string",
        "breathing": "string",
        "muscles": { "primary": ["string"], "secondary": ["string"] }
      }
    }
  ],
  "estimatedDuration": 25,
  "coachNote": "string"
}

Rules for each block:
- warmup: 3–5 light movements (arm circles, leg swings, jumping jacks, high knees, hip rotations). Each 20–40 seconds.
- exercises: 5–8 main exercises, mix of reps and timed. Bodyweight only unless equipment specified.
- recovery: 4–6 stretches/movements matching the recovery type chosen and today's muscle group. Each 30–45 seconds.
- tomorrowFocus: predict tomorrow's muscle group based on today's (e.g. "Upper Body", "Core & Cardio", "Lower Body"). Short string only.
- coachNote: 1–2 sentence personal message to ${profile.name}. Motivating and specific to today's session.`;

  return fetchAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
    3000
  );
}

// ─── AI Coach Chat ─────────────────────────────────────────────

export async function chatWithCoach(profile, history = [], messages = []) {
  const recentContext = history.slice(0, 3)
    .map(h => `${h.muscleGroup} (${h.rating || 'unrated'})`)
    .join(', ') || 'no sessions yet';

  const equipment = Array.isArray(profile.equipment)
    ? profile.equipment.join(', ')
    : profile.equipment || 'bodyweight';

  const systemPrompt = `You are a personal fitness coach for ${profile.name}, ${profile.age || 18} years old, ${profile.weight || '66kg'}, ${profile.height || "5'9\""}.
Goal: ${profile.goal}. Level: ${profile.level}. Equipment: ${equipment}.
Injuries: ${Array.isArray(profile.injuries) ? profile.injuries.join(', ') : 'none'}.
Recent sessions: ${recentContext}.

Guidelines:
- Be concise, warm, and practical (3–5 sentences max per reply)
- Address ${profile.name} by name occasionally
- If they report pain or injury, suggest safe alternatives immediately
- If they want to swap today's workout, suggest a specific full replacement session
- Be encouraging but realistic
- Never make up exercises that require equipment they don't have`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({
      model:       MODEL,
      messages:    [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens:  500,
      temperature: 0.8,
    }),
  });

  if (res.status === 429) {
    throw new Error('Coach is busy right now. Try again in a moment.');
  }
  if (!res.ok) {
    throw new Error('Could not reach coach. Check your connection.');
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── Voice (unchanged) ─────────────────────────────────────────

export function speakText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate  = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;
  const voices    = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-US' && v.name.includes('Google'));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}
