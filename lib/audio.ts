"use client";

import { useProgress } from "@/lib/progress/store";

type Tone = {
  type: OscillatorType;
  /** Частоты: старт и точки рампы [частота, секунда от начала] */
  from: number;
  ramp?: [number, number, "exp" | "lin"][];
  gain: number;
  duration: number;
  delay?: number;
};

/**
 * Синтезированные звуки интерфейса на Web Audio API: без файлов, всё генерируется на лету.
 * Перенесено со старого сайта (CyberAudioEngine). Выключатель — настройка sound в прогрессе.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;

  private context(): AudioContext | null {
    if (!useProgress.getState().sound || typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private tone(ctx: AudioContext, t: Tone, output: AudioNode = ctx.destination) {
    const start = ctx.currentTime + (t.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type;
    osc.frequency.setValueAtTime(t.from, start);
    for (const [freq, at, kind] of t.ramp ?? []) {
      if (kind === "exp") osc.frequency.exponentialRampToValueAtTime(freq, start + at);
      else osc.frequency.linearRampToValueAtTime(freq, start + at);
    }
    gain.gain.setValueAtTime(t.gain, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + t.duration);
    osc.connect(gain);
    gain.connect(output);
    osc.start(start);
    osc.stop(start + t.duration + 0.02);
  }

  click() {
    const ctx = this.context();
    if (ctx) this.tone(ctx, { type: "sine", from: 900, ramp: [[350, 0.03, "exp"]], gain: 0.08, duration: 0.03 });
  }

  /** Этап сдан: мажорное арпеджио */
  success() {
    const ctx = this.context();
    if (!ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((from, i) => {
      this.tone(ctx, { type: "triangle", from, gain: 0.12, duration: 0.28, delay: i * 0.07 });
    });
  }

  error() {
    const ctx = this.context();
    if (ctx) this.tone(ctx, { type: "sawtooth", from: 140, ramp: [[60, 0.25, "lin"]], gain: 0.15, duration: 0.25 });
  }

  bossHit() {
    const ctx = this.context();
    if (ctx) this.tone(ctx, { type: "triangle", from: 220, ramp: [[45, 0.2, "exp"]], gain: 0.2, duration: 0.2 });
  }

  /** Критический удар: лазер плюс саб-удар */
  critHit() {
    const ctx = this.context();
    if (!ctx) return;
    this.tone(ctx, { type: "sawtooth", from: 1200, ramp: [[180, 0.28, "exp"]], gain: 0.25, duration: 0.28 });
    this.tone(ctx, { type: "sine", from: 90, ramp: [[35, 0.28, "exp"]], gain: 0.25, duration: 0.28 });
  }

  achievement() {
    const ctx = this.context();
    if (!ctx) return;
    [440, 554.37, 659.25, 880, 1108.73].forEach((from, i) => {
      this.tone(ctx, { type: "sine", from, gain: 0.1, duration: 0.35, delay: i * 0.05 });
    });
  }

  /** Пасхалка: 808-бас с сатурацией, скользит с F1 до C1 */
  phonk808() {
    const ctx = this.context();
    if (!ctx) return;
    const distortion = ctx.createWaveShaper();
    const k = 18;
    const n = 44100;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * (Math.PI / 180)) / (Math.PI + k * Math.abs(x));
    }
    distortion.curve = curve;
    distortion.connect(ctx.destination);
    this.tone(
      ctx,
      {
        type: "sine",
        from: 130,
        ramp: [
          [43.65, 0.08, "exp"],
          [32.7, 0.7, "lin"],
        ],
        gain: 0.35,
        duration: 0.75,
      },
      distortion,
    );
  }
}

export const sound = new SoundEngine();
