interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

// Synthesizes a short, pleasant two-tone "pop" using the Web Audio API directly -
// no audio file to load, host, or fail on. Purely generated at call time.
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playTone(880, now, 0.12); // A5
    playTone(1318.5, now + 0.08, 0.18); // E6 - a bright, quick two-note "ding"
  } catch {
    // Audio can fail silently (autoplay restrictions, unsupported browser) -
    // never let a sound failure break the actual notification feature.
  }
}