"use client";

import type { Rarity } from "@/lib/game/achievements";
import { useProgress } from "@/lib/progress/store";

type Tone = {
  type: OscillatorType;
  /** Частоты: старт и точки рампы [частота, секунда от начала] */
  from: number;
  ramp?: [number, number, "exp" | "lin"][];
  gain: number;
  duration: number;
  delay?: number;
  /** Расстройка в центах: две копии с ±detune дают хорус */
  detune?: number;
  /** Доля сигнала в реверберацию, 0…1 */
  reverb?: number;
  /** Панорама −1…1 */
  pan?: number;
  /** Фильтр нижних частот: старт и конец за длительность звука */
  lowpass?: [number, number];
};

type Noise = {
  duration: number;
  gain: number;
  filter: BiquadFilterType;
  freq: number;
  freqTo?: number;
  q?: number;
  delay?: number;
  reverb?: number;
  pan?: number;
};

// Пентатоника ля мажор в верхних октавах: случайные ноты из неё всегда звучат созвучно
const SPARKLE_NOTES = [1760, 1975.5, 2217.5, 2637, 2960, 3520, 3951, 4435];

/**
 * Синтезированные звуки интерфейса на Web Audio API: без файлов, всё генерируется на лету.
 * Общая цепочка: мастер-громкость → компрессор, плюс реверберация на сгенерированном импульсе.
 * У нот мягкая атака, поэтому нет щелчков. Выключатель — настройка sound в прогрессе.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: ConvolverNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

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

  /** Мастер-шина: компрессор сглаживает пики, когда звучит несколько слоёв сразу */
  private bus(ctx: AudioContext): { master: GainNode; wet: ConvolverNode } {
    if (this.master && this.wet) return { master: this.master, wet: this.wet };
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    comp.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);

    // Импульс реверберации: стерео-шум с затуханием 1,6 с — мягкий «зал» без файлов
    const seconds = 1.6;
    const length = Math.floor(ctx.sampleRate * seconds);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    const wet = ctx.createConvolver();
    wet.buffer = impulse;
    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.45;
    wet.connect(wetGain);
    wetGain.connect(master);

    this.master = master;
    this.wet = wet;
    return { master, wet };
  }

  /** Выход ноты: панорама, сухой сигнал в мастер и посыл в реверберацию */
  private route(ctx: AudioContext, node: AudioNode, reverb = 0, pan = 0) {
    const { master, wet } = this.bus(ctx);
    let out: AudioNode = node;
    if (pan !== 0 && typeof ctx.createStereoPanner === "function") {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      out = p;
    }
    out.connect(master);
    if (reverb > 0) {
      const send = ctx.createGain();
      send.gain.value = reverb;
      out.connect(send);
      send.connect(wet);
    }
  }

  private tone(ctx: AudioContext, t: Tone, output?: AudioNode) {
    const start = ctx.currentTime + (t.delay ?? 0);
    const end = start + t.duration;
    const voices = t.detune ? [-t.detune, t.detune] : [0];
    const gain = ctx.createGain();
    // Мягкая атака 5 мс вместо мгновенного старта: без щелчка в начале ноты
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(t.gain / voices.length, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    let head: AudioNode = gain;
    if (t.lowpass) {
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.Q.value = 6;
      lp.frequency.setValueAtTime(t.lowpass[0], start);
      lp.frequency.exponentialRampToValueAtTime(t.lowpass[1], end);
      gain.connect(lp);
      head = lp;
    }

    for (const cents of voices) {
      const osc = ctx.createOscillator();
      osc.type = t.type;
      osc.detune.value = cents;
      osc.frequency.setValueAtTime(t.from, start);
      for (const [freq, at, kind] of t.ramp ?? []) {
        if (kind === "exp") osc.frequency.exponentialRampToValueAtTime(freq, start + at);
        else osc.frequency.linearRampToValueAtTime(freq, start + at);
      }
      osc.connect(gain);
      osc.start(start);
      osc.stop(end + 0.03);
    }

    if (output) head.connect(output);
    else this.route(ctx, head, t.reverb, t.pan);
  }

  private noise(ctx: AudioContext, n: Noise) {
    if (!this.noiseBuffer) {
      const length = ctx.sampleRate;
      this.noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    const start = ctx.currentTime + (n.delay ?? 0);
    const end = start + n.duration;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = n.filter;
    filter.Q.value = n.q ?? 1;
    filter.frequency.setValueAtTime(n.freq, start);
    if (n.freqTo) filter.frequency.exponentialRampToValueAtTime(n.freqTo, end);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(n.gain, start + Math.min(0.04, n.duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    src.connect(filter);
    filter.connect(gain);
    this.route(ctx, gain, n.reverb, n.pan);
    src.start(start, Math.random() * 0.5);
    src.stop(end + 0.03);
  }

  /** Колокольчик: основной тон и неровные обертоны, как у металла */
  private bell(ctx: AudioContext, freq: number, delay: number, gain: number, reverb = 0.35, pan = 0) {
    this.tone(ctx, { type: "sine", from: freq, gain, duration: 1.1, delay, reverb, pan });
    this.tone(ctx, { type: "sine", from: freq * 2.76, gain: gain * 0.28, duration: 0.45, delay, reverb, pan });
    this.tone(ctx, { type: "triangle", from: freq * 2, gain: gain * 0.18, duration: 0.3, delay, reverb, pan });
  }

  /** Россыпь искр: быстрые высокие ноты из пентатоники по всей панораме */
  private sparkle(ctx: AudioContext, count: number, delay: number, gain = 0.035) {
    for (let i = 0; i < count; i++) {
      const freq = SPARKLE_NOTES[Math.floor(Math.random() * SPARKLE_NOTES.length)] as number;
      this.tone(ctx, {
        type: "sine",
        from: freq,
        gain,
        duration: 0.22 + Math.random() * 0.2,
        delay: delay + i * (0.045 + Math.random() * 0.03),
        reverb: 0.6,
        pan: Math.random() * 1.6 - 0.8,
      });
    }
  }

  /** Цифровой глитч: рваные вспышки квадратной волны и шума, как сбой сигнала */
  private glitchAt(ctx: AudioContext, delay: number, gain = 0.05) {
    let t = delay;
    for (let i = 0; i < 7; i++) {
      const len = 0.018 + Math.random() * 0.03;
      if (i % 2 === 0) {
        const from = 180 + Math.random() * 1800;
        this.tone(ctx, {
          type: "square",
          from,
          ramp: [[from * (Math.random() > 0.5 ? 0.5 : 2), len, "exp"]],
          gain,
          duration: len,
          delay: t,
          pan: Math.random() * 1.2 - 0.6,
        });
      } else {
        this.noise(ctx, {
          duration: len,
          gain: gain * 1.4,
          filter: "bandpass",
          freq: 800 + Math.random() * 5000,
          q: 4,
          delay: t,
        });
      }
      t += len + Math.random() * 0.025;
    }
  }

  /** Суббас-удар для крупных наград */
  private boom(ctx: AudioContext, delay = 0, gain = 0.22) {
    this.tone(ctx, { type: "sine", from: 120, ramp: [[38, 0.55, "exp"]], gain, duration: 0.7, delay });
    this.noise(ctx, { duration: 0.25, gain: gain * 0.25, filter: "lowpass", freq: 900, freqTo: 120, delay });
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
      this.tone(ctx, { type: "triangle", from, gain: 0.12, duration: 0.28, delay: i * 0.07, reverb: 0.2 });
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

  /**
   * Достижение: чем выше редкость, тем больше слоёв. Обычное — два колокольчика, редкое — арпеджио с шиммером,
   * эпическое — взлёт, арпеджио с хорусом и искры, легендарное — удар, аккорд с раскрывающимся фильтром,
   * колокола, россыпь искр и глитч. glitch добавляет сбой сигнала к любой редкости (тайные знаки).
   */
  achievement(rarity: Rarity = "rare", opts: { glitch?: boolean } = {}) {
    const ctx = this.context();
    if (!ctx) return;
    switch (rarity) {
      case "common":
        this.bell(ctx, 1318.5, 0, 0.1, 0.3, -0.2);
        this.bell(ctx, 1975.5, 0.09, 0.08, 0.3, 0.2);
        break;
      case "rare":
        [880, 1108.7, 1318.5, 1760].forEach((f, i) => {
          this.bell(ctx, f, i * 0.065, 0.085, 0.45, -0.3 + i * 0.2);
        });
        this.noise(ctx, { duration: 0.6, gain: 0.025, filter: "highpass", freq: 6000, delay: 0.15, reverb: 0.6 });
        break;
      case "epic":
        this.noise(ctx, { duration: 0.4, gain: 0.05, filter: "bandpass", freq: 400, freqTo: 5000, q: 2, reverb: 0.4 });
        [659.25, 830.6, 987.8, 1318.5, 1661.2].forEach((f, i) => {
          this.tone(ctx, {
            type: "triangle",
            from: f,
            gain: 0.07,
            duration: 0.7,
            delay: 0.25 + i * 0.07,
            detune: 7,
            reverb: 0.5,
          });
          this.bell(ctx, f * 2, 0.25 + i * 0.07, 0.03, 0.5);
        });
        this.sparkle(ctx, 5, 0.6);
        break;
      case "legendary":
        this.boom(ctx);
        // Аккорд ля мажор пилой: фильтр раскрывается, звук «расцветает»
        for (const f of [220, 277.2, 329.6, 440]) {
          this.tone(ctx, {
            type: "sawtooth",
            from: f,
            gain: 0.05,
            duration: 1.6,
            delay: 0.05,
            detune: 9,
            reverb: 0.6,
            lowpass: [350, 5200],
          });
        }
        [880, 1108.7, 1318.5, 1760, 2217.5].forEach((f, i) => {
          this.bell(ctx, f, 0.3 + i * 0.075, 0.075, 0.55, -0.4 + i * 0.2);
        });
        this.sparkle(ctx, 10, 0.7, 0.03);
        this.glitchAt(ctx, 1.25, 0.04);
        break;
    }
    if (opts.glitch && rarity !== "legendary") this.glitchAt(ctx, rarity === "common" ? 0.25 : 0.55);
  }

  /** Новый уровень: короткий взлёт на три ноты с искрами */
  levelUp(delay = 0) {
    const ctx = this.context();
    if (!ctx) return;
    [1046.5, 1318.5, 1568].forEach((from, i) => {
      this.tone(ctx, { type: "triangle", from, gain: 0.09, duration: 0.3, delay: delay + i * 0.06, reverb: 0.35 });
    });
    this.sparkle(ctx, 3, delay + 0.2);
  }

  /** Новый ранг: фанфара растёт со ступенью ранга 1…5, на пятой добавляется глитч */
  rankUp(tier = 1) {
    const ctx = this.context();
    if (!ctx) return;
    this.boom(ctx, 0, 0.16 + tier * 0.02);
    this.noise(ctx, { duration: 0.5, gain: 0.05, filter: "bandpass", freq: 300, freqTo: 6000, q: 1.5, reverb: 0.5 });
    const chord = [261.6, 329.6, 392, 523.3, 659.3];
    for (const f of chord.slice(0, 2 + Math.min(tier, 3))) {
      this.tone(ctx, {
        type: "sawtooth",
        from: f,
        gain: 0.045,
        duration: 1.3 + tier * 0.1,
        delay: 0.1,
        detune: 8,
        reverb: 0.6,
        lowpass: [400, 4000 + tier * 600],
      });
    }
    [1046.5, 1318.5, 1568, 2093].forEach((f, i) => {
      this.bell(ctx, f, 0.35 + i * 0.08, 0.07, 0.5, -0.3 + i * 0.2);
    });
    this.sparkle(ctx, 3 + tier * 2, 0.7);
    if (tier >= 5) this.glitchAt(ctx, 1.3);
  }

  /** Отдельный глитч: для закрытого тайного знака и пасхалок */
  glitch() {
    const ctx = this.context();
    if (ctx) this.glitchAt(ctx, 0);
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
    this.route(ctx, distortion);
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
