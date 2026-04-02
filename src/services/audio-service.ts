type SfxId = "hit" | "defeat" | "pickup" | "level-up" | "hurt" | "boss-alert";

let audioContext: AudioContext | null = null;
let unlocked = false;

export function installAudioUnlock(): void {
  const unlock = (): void => {
    void primeAudio();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}

export async function primeAudio(): Promise<void> {
  const context = getAudioContext();
  if (context.state === "suspended") {
    await context.resume();
  }
  unlocked = true;
}

export function playSfx(id: SfxId): void {
  const context = getAudioContext();
  if (!unlocked && context.state !== "running") {
    return;
  }

  switch (id) {
    case "hit":
      playTone(context, 420, 0.03, "triangle", 0.03);
      playTone(context, 280, 0.06, "square", 0.02, 0.005);
      break;
    case "defeat":
      playTone(context, 240, 0.08, "square", 0.05);
      playTone(context, 180, 0.12, "triangle", 0.04, 0.03);
      break;
    case "pickup":
      playTone(context, 760, 0.06, "sine", 0.03);
      break;
    case "level-up":
      playTone(context, 420, 0.08, "triangle", 0.04);
      playTone(context, 620, 0.1, "sine", 0.05, 0.05);
      playTone(context, 820, 0.12, "sine", 0.04, 0.1);
      break;
    case "hurt":
      playTone(context, 160, 0.08, "sawtooth", 0.05);
      break;
    case "boss-alert":
      playTone(context, 220, 0.18, "square", 0.06);
      playTone(context, 196, 0.2, "square", 0.05, 0.14);
      break;
  }
}

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  delay = 0
): void {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime + delay;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}
