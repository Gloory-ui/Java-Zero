/**
 * Web Audio API Engine: Звуки HUD, эффекты Босс-файта и Phonk 808 Пасхалка
 */
class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem("java_zero_sound") !== "false";
    this.ambientPlaying = false;
    this.ambientNodes = [];
    this.phonkMode = false;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    localStorage.setItem("java_zero_sound", this.enabled);
    if (!this.enabled && this.ambientPlaying) {
      this.stopAmbient();
    }
    return this.enabled;
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.03);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.07);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.07 + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + i * 0.07);
      osc.stop(this.ctx.currentTime + i * 0.07 + 0.3);
    });
  }

  playError() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // --- ЭФФЕКТЫ БОСС-ФАЙТА ---
  playBossHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  playCritHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    // Двойной тон: неоновый лазер + саб-удар
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.28);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.3);
    osc2.stop(this.ctx.currentTime + 0.3);
  }

  playAchievement() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const arp = [440, 554.37, 659.25, 880, 1108.73];
    arp.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.05 + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.05);
      osc.stop(this.ctx.currentTime + idx * 0.05 + 0.38);
    });
  }

  // --- ПАСХАЛКА: PHONK 808 BASS ---
  playPhonk808Drop() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const distortion = this.ctx.createWaveShaper();

    // Сатурация
    function makeCurve(amount = 20) {
      const k = typeof amount === 'number' ? amount : 50;
      const n = 44100;
      const curve = new Float32Array(n);
      const deg = Math.PI / 180;
      for (let i = 0; i < n; ++i) {
        const x = (i * 2) / n - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    distortion.curve = makeCurve(18);
    osc.type = "sine";

    // Скользящий бас с F1 (43Hz) до C1 (32Hz)
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(43.65, this.ctx.currentTime + 0.08);
    osc.frequency.linearRampToValueAtTime(32.7, this.ctx.currentTime + 0.7);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  toggleAmbient() {
    if (this.ambientPlaying) {
      this.stopAmbient();
      return false;
    } else {
      this.startAmbient();
      return true;
    }
  }

  startAmbient() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    this.stopAmbient();
    this.ambientPlaying = true;

    const freqs = [130.81, 131.4, 196.0];
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.045, this.ctx.currentTime + 2.0);

    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(f, this.ctx.currentTime);
      osc.connect(filter);
      osc.start();
      this.ambientNodes.push(osc);
    });

    filter.connect(masterGain);
    masterGain.connect(this.ctx.destination);
    this.ambientNodes.push(filter, masterGain);
  }

  stopAmbient() {
    this.ambientPlaying = false;
    this.ambientNodes.forEach(n => {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (e) {}
    });
    this.ambientNodes = [];
  }
}

export const audio = new CyberAudioEngine();