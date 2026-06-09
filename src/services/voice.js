export function speakExercise(exercise) {
  if (!exercise) return;
  
  const text = `Next up: ${exercise.name}. ${exercise.sets} sets of ${exercise.reps} reps. ${exercise.notes ? exercise.notes : ''}`;
  speak(text);
}

export function speakText(text) {
  speak(text);
}

function speak(text) {
  if (!window.speechSynthesis) return;
  
  window.speechSynthesis.cancel();
  
  // Small delay to ensure cancel takes effect
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    
    // Wait for voices to load
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = 
        voices.find(v => v.name === 'Google US English') ||
        voices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('male')) ||
        voices.find(v => v.lang === 'en-US') ||
        voices[0];
      
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
    };
    
    if (window.speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }
  }, 100);
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
